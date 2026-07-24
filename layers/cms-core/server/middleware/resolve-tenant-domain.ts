import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../types/database.types'

/**
 * Makes a live custom domain — or a {slug}.{baseDomain} subdomain, or in
 * dev a {slug}.localhost subdomain — transparently serve that site's
 * pages.
 *
 * Runs on every request. If the incoming Host header matches a site's
 * `custom_domain` (set on the Settings page), or its hostname is
 * `{slug}.localhost` for any port, or (once NUXT_BASE_DOMAIN is
 * configured — see README.md "Wildcard subdomains per site")
 * `{slug}.{baseDomain}`, the request is rewritten in place to the
 * /preview/[siteSlug]/... renderer before Nuxt's router ever sees it —
 * the visitor's browser still shows their own domain in the address bar,
 * they just silently get that site's content instead of the admin app.
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

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/preview/') || url.pathname.startsWith('/_nuxt/')) {
        return
    }

    const host = getRequestHost(event, { xForwardedHost: true })
    if (!host) return

    const hostname = host.split(':')[0] ?? host
    const client = await serverSupabaseClient<Database>(event)
    const { baseDomain } = useRuntimeConfig(event)

    const subdomainSuffix = hostname.endsWith('.localhost')
        ? '.localhost'
        : baseDomain && hostname.endsWith(`.${baseDomain}`)
            ? `.${baseDomain}`
            : null

    let site: { slug: string } | null = null

    if (subdomainSuffix) {
        const candidateSlug = hostname.slice(0, -subdomainSuffix.length)
        const { data } = await client
            .from('sites')
            .select('slug')
            .eq('slug', candidateSlug)
            .eq('status', 'active')
            .maybeSingle()
        site = data
    }

    if (!site) {
        const { data } = await client
            .from('sites')
            .select('slug')
            .eq('custom_domain', hostname)
            .eq('status', 'active')
            .maybeSingle()
        site = data
    }

    if (!site) return

    const rewrittenPath = `/preview/${site.slug}${url.pathname === '/' ? '' : url.pathname}`

    // Forwarded automatically to the inner call below (h3's
    // fetchWithEvent, which event.fetch is built on, forwards the
    // current event's headers via getProxyRequestHeaders) — set before
    // the call so /preview/[siteSlug]/[...path].vue can read it.
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
    // is /preview/{slug}/... — that's the page Nuxt actually matched,
    // and Vue Router needs that to stay intact so client-side hydration
    // resolves to the SAME component the server rendered. (An earlier
    // version of this middleware blanked that field out to fix the
    // address bar — that broke hydration instead: Vue Router then
    // re-resolved the real browser path against the route table, which
    // matches pages/index.vue, not this preview page, so real visitors
    // got a flash of site content immediately replaced by the admin
    // app's own '/' page and its redirect to /login. The address bar is
    // fixed cosmetically instead, client-side only, in
    // pages/preview/[siteSlug]/[...path].vue via history.replaceState —
    // see the comment there for why that's safe.)
    const response = await event.fetch(rewrittenPath + url.search)

    setResponseStatus(event, response.status)
    const contentType = response.headers.get('content-type')
    if (contentType) {
        setResponseHeader(event, 'content-type', contentType)
    }
    return await response.text()
})
