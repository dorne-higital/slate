export default defineEventHandler(async (event) => {
    const { site, role } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    return await loadPeople(site.id, role)
})
