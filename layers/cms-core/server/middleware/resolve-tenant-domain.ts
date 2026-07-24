import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../types/database.types'

/**
 * Makes a live custom domain — or, in dev, a {slug}.localhost subdomain —
 * transparently serve that site's pages.
 *
 * Runs on every request. If the incoming Host header matches a site's
 * `custom_domain` (set on the Settings page), or its hostname is
 * `{slug}.localhost` for any port, the request is rewritten in place to
 * the /preview/[siteSlug]/... renderer before Nuxt's router ever sees it
 * — the visitor's browser still shows their own domain in the address
 * bar, they just silently get that site's content instead of the admin
 * app. Any host that doesn't match either falls through to normal
 * routing untouched — this is entirely data-driven, there's no separate
 * "primary domain" to configure.
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

    let site: { slug: string } | null = null

    if (hostname.endsWith('.localhost')) {
        const candidateSlug = hostname.slice(0, -'.localhost'.length)
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
    event.node.req.headers['x-slate-tenant-domain'] = host

    // Mutating event.node.req.url / event._path doesn't reliably change
    // what Nuxt's own SSR router resolves — proxying the request
    // internally (to our own server, NOT the incoming Host) is the
    // robust way to serve a different route for the same incoming URL
    // without a visible browser redirect.
    //
    // SECOND LOOK: this self-dials via localhost + the server's own
    // listening port, which is correct for a persistent Node process
    // (self-hosted / Docker). Verify this still holds on Netlify
    // specifically — if their Nuxt build targets Netlify Functions
    // rather than a persistent node-server, a function can't reliably
    // dial itself back over localhost and this needs a different
    // mechanism there (e.g. resolving and rendering in-process instead
    // of proxying over the network).
    const port = process.env.PORT || '3000'
    const target = new URL(rewrittenPath + url.search, `http://localhost:${port}`).toString()
    return proxyRequest(event, target)
})
