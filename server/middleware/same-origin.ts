/**
 * Cross-site request protection for the CMS API. Client sites live on *.slatecms.co.uk, which
 * browsers treat as the same "site" as slatecms.co.uk, so SameSite cookies alone wouldn't stop a
 * page on a client site from sending a logged-in admin's browser to our API. Any request that
 * changes something under /api/ (except the public endpoints visitors use) must come from
 * Slate's own origin.
 */
export default defineEventHandler((event) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(event.method)) return
    const path = event.path
    if (!path.startsWith('/api/') || path.startsWith('/api/public/')) return

    const origin = getRequestHeader(event, 'origin')
    // Non-browser clients (curl, server-to-server) send no Origin; browsers always do on POST/PATCH/PUT/DELETE
    if (!origin) return
    let originHost = ''
    try {
        originHost = new URL(origin).host
    } catch {
        throw createError({ statusCode: 403, statusMessage: 'Request blocked' })
    }
    if (!isAppHost(originHost, useRuntimeConfig().public.appHost)) {
        throw createError({ statusCode: 403, statusMessage: 'Request blocked' })
    }
})
