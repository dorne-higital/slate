/** Slate replies; the customer is emailed. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    requirePlatformAdmin(user)
    const ticket = await loadTicket(getRouterParam(event, 'ticketId')!)
    const body = cleanMessage((await readBody<{ body?: string }>(event)).body)
    await addMessage(ticket.id, user.id, body, true)
    event.waitUntil?.(notifyCustomer(ticket, body))
    return await loadTicket(ticket.id)
})
