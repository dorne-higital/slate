import { eq } from 'drizzle-orm'

/** Platform admins can re-file a ticket: change its type or a bug's severity. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = String(getRouterParam(event, 'ticketId'))
    await loadTicket(id)
    const b = await readBody<{ category?: string, severity?: string | null }>(event)
    const set: Partial<typeof schema.supportTickets.$inferInsert> = {}
    const category = b.category !== undefined ? findTicketCategory(b.category) : undefined
    if (b.category !== undefined && !category) throw createError({ statusCode: 400, statusMessage: 'Unknown type' })
    if (category) set.category = category.key
    if (b.severity !== undefined) set.severity = b.severity === null ? null : (TICKET_SEVERITIES.find(s => s.key === b.severity)?.key ?? null)
    if ((category && category.key !== 'bug')) set.severity = null
    if (Object.keys(set).length) await useDb().update(schema.supportTickets).set(set).where(eq(schema.supportTickets.id, id))
    return await loadTicket(id)
})
