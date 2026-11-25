/** iOS universal links: lets the site owner's iPhone app open links to their site. Set in Integrations › iOS universal links. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    const appId = site?.integrations?.appleAppLinks
    if (!appId) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    setResponseHeaders(event, { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' })
    return {
        applinks: { details: [{ appIDs: [appId], components: [{ '/': '*' }] }] },
        webcredentials: { apps: [appId] }
    }
})
