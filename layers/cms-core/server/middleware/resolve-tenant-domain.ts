import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '../../types/database.types'

/**
 * Makes a live custom domain — or a {slug}.{baseDomain} subdomain, or in
 * dev a {slug}.localhost subdomain — transparently serve that site's
 * pages, and makes admin.{baseDomain} / admin.localhost serve the
 * platform-admin dashboard.
 *
 * Runs on every request. If the incoming Host header's subdomain is the
 * reserved label `admin`, the request is rewritten to /admin. Otherwise,
 * if the Host matches a site's `custom_domain`, or its hostname is
 * `{slug}.localhost` for any port, or (once NUXT_PUBLIC_BASE_DOMAIN is
 * configured — see README.md "Wildcard subdomains per site")
 * `{slug}.{baseDomain}`, the request is rewritten in place to that site's
 * renderer before Nuxt's router ever sees it — the visitor's browser
 * still shows their own domain in the address bar, they just silently
 * get different content instead of the marketing app.
 *
 * A {slug}.{baseDomain}/.localhost subdomain (but *not* a custom_domain
 * match — that's a site's public storefront URL, meant to always show
 * the published site even to its own owner) renders the CMS dashboard
 * instead of the public site when the requester is authenticated and has
 * access to that site: same in-process rewrite trick, just targeting
 * /sites/{id} instead of /preview/{slug}. Anyone else (logged out, or not
 * a member) still gets the public preview render, same as today.
 *
 * Any host that doesn't match falls through to normal routing untouched
 * — this is entirely data-driven, there's no separate "primary domain"
 * to configure.
 *
 * `*.localhost` is reserved by RFC 6761 to always resolve to loopback —
 * every modern browser and OS honors this with zero setup (no
 * /etc/hosts editing), which is what makes it a clean stand-in here for
 * "this site's own domain" during local development.
 */
export default defineEventHandler(async (event) => {
    const url = getRequestURL(event)

    // /admin and /sites/ are also the *targets* this middleware rewrites
    // to below — event.fetch re-enters this same middleware for its
    // inner request, so these guard the second pass from rewriting again
    // (host/headers are unchanged on the inner call, so without this
    // it would recurse forever).
    if (
        url.pathname.startsWith('/api/')
        || url.pathname.startsWith('/preview/')
        || url.pathname.startsWith('/_nuxt/')
        || url.pathname.startsWith('/admin')
        || url.pathname.startsWith('/sites/')
    ) {
        return
    }

    const host = getRequestHost(event, { xForwardedHost: true })
    if (!host) return

    const hostname = host.split(':')[0] ?? host
    const client = await serverSupabaseClient<Database>(event)
    const { baseDomain } = useRuntimeConfig(event).public

    const subdomainSuffix = hostname.endsWith('.localhost')
        ? '.localhost'
        : baseDomain && hostname.endsWith(`.${baseDomain}`)
            ? `.${baseDomain}`
            : null

    const atRoot = url.pathname === '/'
    const subPath = atRoot ? '' : url.pathname
    const label = subdomainSuffix ? hostname.slice(0, -subdomainSuffix.length) : null

    // The dashboard rewrites below (admin subdomain, and an authenticated
    // owner's own site subdomain) only apply at the bare root — /admin
    // and /sites/{id} have no nested route standing in for arbitrary
    // paths, so blindly prefixing every path (e.g. /login, /register,
    // /confirm) would rewrite it to a URL that doesn't exist (/admin/login),
    // which 404s into auth.global.ts's redirect, which then reuses that
    // broken path as the next `redirect` query value — an infinite,
    // ever-growing redirect loop. Any non-root path just falls through to
    // normal routing (admin) or the public preview render (a site
    // subdomain), same as if this middleware had never run — real,
    // already-working top-level routes like /login must resolve
    // identically no matter which host reached them.
    if (label === 'admin') {
        if (!atRoot) return
    }

    let targetPath: string

    if (label === 'admin') {
        targetPath = '/admin'
    } else {
        let site: { id: string, slug: string } | null = null
        let viaSubdomain = false

        if (label) {
            const { data } = await client
                .from('sites')
                .select('id, slug')
                .eq('slug', label)
                .eq('status', 'active')
                .maybeSingle()
            site = data
            viaSubdomain = Boolean(site)
        }

        if (!site) {
            const { data } = await client
                .from('sites')
                .select('id, slug')
                .eq('custom_domain', hostname)
                .eq('status', 'active')
                .maybeSingle()
            site = data
        }

        if (!site) return

        targetPath = `/preview/${site.slug}${subPath}`

        if (viaSubdomain && atRoot) {
            // serverSupabaseUser() throws (rather than returning null) when
            // there's no session at all ("Auth session missing!") — the
            // normal case for an anonymous visitor to a site's subdomain,
            // not a failure, so it's treated the same as "not logged in".
            const user = await serverSupabaseUser(event).catch(() => null)

            if (user) {
                const { data: hasAccess } = await client.rpc('has_site_role', {
                    target_site_id: site.id,
                    min_role: 'viewer'
                })

                if (hasAccess) {
                    targetPath = `/sites/${site.id}`
                }
            }
        }
    }

    // Forwarded automatically to the inner call below (h3's
    // fetchWithEvent, which event.fetch is built on, forwards the
    // current event's headers via getProxyRequestHeaders) — set before
    // the call so pages reached this way (preview, admin, site
    // dashboard) can read it via useTenantHost().
    event.node.req.headers['x-slate-tenant-domain'] = host

    // event.fetch resolves in-process — Nitro's own onRequest hook binds
    // it to fetchNodeRequestHandler, which calls the same h3 app
    // in-memory (see node_modules/nitropack/dist/runtime/internal/app.mjs)
    // rather than opening a real socket. That's what makes this safe on
    // serverless (Netlify Functions, Vercel), not just a persistent
    // Node process — there's no "self" to dial back into over a port,
    // because no network call happens at all.
    //
    // (Directly mutating event._path/event.node.req.url instead, to
    // avoid a second render pass entirely, was tried and reverted —
    // Nitro's own h3 app resolves the route to dispatch to before this
    // middleware runs and does not re-resolve it afterward, so Vue
    // Router's auth guard still saw the original path and redirected to
    // /login even though event.path itself read back correctly.)
    //
    // The rendered HTML's hydration payload legitimately says its route
    // is /preview/{slug}/... or /admin or /sites/{id}/... — that's the
    // page Nuxt actually matched, and Vue Router needs that to stay
    // intact so client-side hydration resolves to the SAME component the
    // server rendered. (An earlier version of this middleware blanked
    // that field out to fix the address bar — that broke hydration
    // instead: Vue Router then re-resolved the real browser path against
    // the route table, which doesn't match this page, so real visitors
    // got a flash of the right content immediately replaced by the wrong
    // page. The address bar is fixed cosmetically instead, client-side
    // only, via useTenantAddressBarFix() — see composables/useTenantHost.ts.)
    const response = await event.fetch(targetPath + url.search)

    setResponseStatus(event, response.status)

    for (const headerName of ['content-type', 'location']) {
        const value = response.headers.get(headerName)
        if (value) setResponseHeader(event, headerName, value)
    }

    // The inner render's auth guard (middleware/auth.global.ts) can
    // redirect to /login for an unauthenticated admin/site-dashboard
    // rewrite target, and Supabase's SSR client can refresh session
    // cookies during render — both need to reach the real visitor's
    // browser, not get silently dropped.
    for (const cookie of response.headers.getSetCookie()) {
        appendResponseHeader(event, 'set-cookie', cookie)
    }

    return await response.text()
})
