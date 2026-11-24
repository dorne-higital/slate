import { eq } from 'drizzle-orm'

/** Every ticket across Slate, newest activity first. ?status=open|answered|closed */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const status = String(getQuery(event).status ?? '')
    const tickets = await listTickets(['open', 'answered', 'closed'].includes(status) ? eq(schema.supportTickets.status, status as TicketStatus) : undefined)
    // Open bugs by severity first (P1, P2, P3), then everything else by latest activity
    const rank = (t: { status: string, severity: string | null }) => t.status === 'open' && t.severity ? Number(t.severity.slice(1)) : 9
    return tickets.sort((a, b) => rank(a) - rank(b))
})
