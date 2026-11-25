export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const ticket = await loadTicket(getRouterParam(event, 'ticketId')!, site.id)
    await markSeenBySite(ticket.id)
    return ticket
})
