export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    return await loadTicket(getRouterParam(event, 'ticketId')!)
})
