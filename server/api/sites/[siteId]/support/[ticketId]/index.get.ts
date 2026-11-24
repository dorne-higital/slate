export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    return await loadTicket(getRouterParam(event, 'ticketId')!, site.id)
})
