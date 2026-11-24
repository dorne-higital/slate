/**
 * One address per site: once a site's main domain is live, its free {slug} address and any
 * other connected domains send visitors there (permanent redirect, same path).
 * API calls and Slate's own host are left alone.
 */
export default defineEventHandler(async (event) => {
    if (event.method !== 'GET' && event.method !== 'HEAD') return
    if (event.path.startsWith('/api/') || event.path.startsWith('/_nuxt/')) return

    const host = getRequestHost(event, { xForwardedHost: true }) || ''
    if (!host || isAppHost(host, useRuntimeConfig().public.appHost)) return
    if (!useRuntimeConfig().databaseUrl) return

    const site = await resolveTenant(event)
    if (!site?.customDomain || stripPort(host) === site.customDomain) return

    const target = await liveAddress(site)
    if (target === stripPort(host) || target !== site.customDomain) return
    return sendRedirect(event, `https://${target}${event.path}`, 301)
})
