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
    const response = await event.fetch(rewrittenPath + url.search)

    setResponseStatus(event, response.status)
    const contentType = response.headers.get('content-type')
    if (contentType) {
        setResponseHeader(event, 'content-type', contentType)
    }

    const body = await response.text()
    if (!contentType?.includes('text/html')) {
        return body
    }

    return stripInnerRouteFromPayload(body)
})

// The rendered HTML's own route genuinely is /preview/{slug}/..., since
// that's the page Nuxt actually matched — its hydration payload embeds
// that path (nuxt/dist/app/nuxt.js: `payload.path = ssrContext.url`).
// On the client, Vue Router's createCurrentLocation() (nuxt/dist/pages/
// runtime/plugins/router.js) compares payload.path against the real
// window.location and — finding them different — trusts payload.path
// and pushes it into browser history, which is what visibly appended
// /preview/{slug} to the address bar. Blanking that one field out (it's
// only ever read as `!renderedPath ? displayedPath : ...`) makes it fall
// back to the real, already-correct URL instead — everything else in
// the payload (the fetched page content) is untouched.
function stripInnerRouteFromPayload(html: string): string {
    const match = html.match(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)([\s\S]*?)(<\/script>)/)
    const [whole, openTag, json, closeTag] = match ?? []
    if (match?.index === undefined || whole === undefined || openTag === undefined || json === undefined || closeTag === undefined) return html

    try {
        const payload = JSON.parse(json) as unknown[]
        const meta = payload.find(
            (item): item is { path: number } =>
                Boolean(item) && typeof item === 'object' && !Array.isArray(item) && 'serverRendered' in (item as object) && typeof (item as { path?: unknown }).path === 'number'
        )
        if (!meta) return html

        payload[meta.path] = ''

        return html.slice(0, match.index) + openTag + JSON.stringify(payload) + closeTag + html.slice(match.index + whole.length)
    } catch {
        return html
    }
}
