/** The site health check for Overview: a score and plain-English things to fix. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    return siteHealth(site)
})
