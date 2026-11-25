/**
 * Runs before every request on a client site's address:
 *  - Offline sites get a short holding page (and their public API answers 503).
 *  - One address per site: once a site's main domain is live, its free {slug} address and any
 *    other connected domains send visitors there (permanent redirect, same path).
 * Slate's own host is left alone.
 */
export default defineEventHandler(async (event) => {
    const host = getRequestHost(event, { xForwardedHost: true }) || ''
    if (!host || isAppHost(host, useRuntimeConfig().public.appHost)) return
    if (!useRuntimeConfig().databaseUrl) return
    if (event.path.startsWith('/_nuxt/')) return

    const site = await resolveTenant(event)
    if (!site) return

    const paused = !site.offline && await isSitePaused(site)
    if (site.offline || paused) {
        setResponseStatus(event, 503)
        setResponseHeader(event, 'retry-after', 3600)
        if (event.path.startsWith('/api/')) return { error: true, statusMessage: 'This site is offline' }
        setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
        const name = site.name.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
        return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${name}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f7f8fa;color:#2e3445}main{padding:24px;text-align:center}h1{font-size:28px;margin:0 0 8px}p{margin:0;color:#555c6e}</style>
</head><body><main><h1>${name}</h1><p>${paused ? 'This site isn’t available right now.' : 'This site is taking a short break. Please check back soon.'}</p></main></body></html>`
    }

    if (event.method !== 'GET' && event.method !== 'HEAD') return
    if (event.path.startsWith('/api/')) return
    if (!site.customDomain || stripPort(host) === site.customDomain) return
    // Local development ({slug}.localhost): stay local, so forms and changes go to the local database
    if (/(^|\.)localhost$|^127\.0\.0\.1$/.test(stripPort(host))) return
    const target = await liveAddress(site)
    if (target === stripPort(host) || target !== site.customDomain) return
    return sendRedirect(event, `https://${target}${event.path}`, 301)
})
