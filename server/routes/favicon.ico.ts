/**
 * /favicon.ico, which browsers ask for on every site whatever the page says.
 * Slate's own host gets Slate's icon; a client site gets its own favicon (from Theme), or nothing.
 */
export default defineEventHandler(async (event) => {
    const host = getRequestHost(event, { xForwardedHost: false })
    if (isAppHost(host, useRuntimeConfig().public.appHost)) {
        const ico = await useStorage('assets:server').getItemRaw<Uint8Array | ArrayBuffer>('slate-favicon.ico')
        if (!ico) throw createError({ statusCode: 404, statusMessage: 'Not found' })
        setResponseHeaders(event, { 'content-type': 'image/x-icon', 'cache-control': 'public, max-age=86400' })
        return ico instanceof Uint8Array ? ico : new Uint8Array(ico)
    }
    const site = await resolveTenant(event)
    const icon = site?.theme?.favicon
    if (!icon) {
        setResponseHeader(event, 'cache-control', 'public, max-age=3600')
        throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
    return sendRedirect(event, icon, 302)
})
