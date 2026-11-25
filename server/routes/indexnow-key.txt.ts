/** The site's IndexNow key, so search engines can check our pings are really from this site. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    setResponseHeaders(event, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' })
    return indexNowKey(site.id)
})
