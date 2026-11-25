/** The site's secret-backed integrations, masked, plus the forms an email list can use. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    return {
        connections: connectionsView(site.connections),
        forms: await formsWithEmail(site.id),
        allowed: connectionsAllowed((await payerLimits(site)).limits)
    }
})
