/** The customer replies (this reopens a closed ticket). */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const ticket = await loadTicket(getRouterParam(event, 'ticketId')!, site.id)
    const body = cleanMessage((await readBody<{ body?: string }>(event)).body)
    await addMessage(ticket.id, user.id, body, false)
    await markSeenBySite(ticket.id)
    event.waitUntil?.(notifySlate(ticket, user.name, body, false))
    return await loadTicket(ticket.id, site.id)
})
