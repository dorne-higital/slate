import { eq } from 'drizzle-orm'

/** Every ticket across Slate, newest activity first. ?status=open|answered|closed */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const status = String(getQuery(event).status ?? '')
    return await listTickets(['open', 'answered', 'closed'].includes(status) ? eq(schema.supportTickets.status, status as TicketStatus) : undefined)
})
