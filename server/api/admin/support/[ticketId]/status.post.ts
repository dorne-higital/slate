import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const ticket = await loadTicket(getRouterParam(event, 'ticketId')!)
    const { status } = await readBody<{ status?: TicketStatus }>(event)
    if (!status || !['open', 'answered', 'closed'].includes(status)) throw createError({ statusCode: 400, statusMessage: 'Pick a status' })
    await useDb().update(schema.supportTickets).set({ status, updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticket.id))
    return await loadTicket(ticket.id)
})
