export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    return await loadMenus(site.id)
})
