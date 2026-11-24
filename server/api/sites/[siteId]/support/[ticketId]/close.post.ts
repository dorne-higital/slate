import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const ticket = await loadTicket(getRouterParam(event, 'ticketId')!, site.id)
    await useDb().update(schema.supportTickets).set({ status: 'closed', updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticket.id))
    return await loadTicket(ticket.id, site.id)
})
