import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm'

export type TicketStatus = 'open' | 'answered' | 'closed'

export function cleanMessage(raw: unknown) {
    const body = String(raw ?? '').replace(/\r\n/g, '\n').trim().slice(0, 5000)
    if (!body) throw createError({ statusCode: 400, statusMessage: 'Write a message first' })
    return body
}

export async function listTickets(where?: SQL) {
    const db = useDb()
    const rows = await db.select({
        id: schema.supportTickets.id,
        siteId: schema.supportTickets.siteId,
        siteName: schema.sites.name,
        subject: schema.supportTickets.subject,
        status: schema.supportTickets.status,
        createdAt: schema.supportTickets.createdAt,
        updatedAt: schema.supportTickets.updatedAt,
        openedByName: schema.user.name,
        openedByEmail: schema.user.email,
        messages: sql<number>`(select count(*)::int from support_messages m where m.ticket_id = "support_tickets"."id")`,
        // A Slate reply the site hasn't opened yet
        unread: sql<boolean>`exists(select 1 from support_messages m where m.ticket_id = "support_tickets"."id" and m.from_slate and m.created_at > coalesce("support_tickets"."customer_seen_at", 'epoch'))`
    })
        .from(schema.supportTickets)
        .innerJoin(schema.sites, eq(schema.sites.id, schema.supportTickets.siteId))
        .leftJoin(schema.user, eq(schema.user.id, schema.supportTickets.openedBy))
        .where(where)
        .orderBy(desc(schema.supportTickets.updatedAt))
        .limit(300)
    return rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))
}

export async function loadTicket(ticketId: string, siteId?: string) {
    if (!isUuid(ticketId)) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
    const [ticket] = await listTickets(siteId ? and(eq(schema.supportTickets.id, ticketId), eq(schema.supportTickets.siteId, siteId)) : eq(schema.supportTickets.id, ticketId))
    if (!ticket) throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
    const messages = await useDb().select({
        id: schema.supportMessages.id,
        body: schema.supportMessages.body,
        fromSlate: schema.supportMessages.fromSlate,
        authorName: schema.user.name,
        createdAt: schema.supportMessages.createdAt
    })
        .from(schema.supportMessages)
        .leftJoin(schema.user, eq(schema.user.id, schema.supportMessages.authorId))
        .where(eq(schema.supportMessages.ticketId, ticketId))
        .orderBy(asc(schema.supportMessages.createdAt))
    return { ...ticket, messages: messages.map(m => ({ ...m, authorName: m.fromSlate ? 'Slate support' : m.authorName, createdAt: m.createdAt.toISOString() })) }
}

export async function addMessage(ticketId: string, authorId: string, body: string, fromSlate: boolean) {
    const db = useDb()
    await db.batch([
        db.insert(schema.supportMessages).values({ ticketId, authorId, body, fromSlate }),
        db.update(schema.supportTickets).set({ status: fromSlate ? 'answered' : 'open', updatedAt: new Date() }).where(eq(schema.supportTickets.id, ticketId))
    ])
}

/** New ticket or customer reply: tell every platform admin. */
export async function notifySlate(ticket: { id: string, subject: string, siteName: string }, fromName: string, body: string, isNew: boolean) {
    const admins = await useDb().select({ email: schema.user.email }).from(schema.user).where(eq(schema.user.isPlatformAdmin, true))
    if (!admins.length) return
    await sendEmail({
        to: admins.map(a => a.email),
        subject: `${isNew ? 'New support ticket' : 'Reply'}: ${ticket.subject} (${ticket.siteName})`,
        text: `${fromName} on ${ticket.siteName} ${isNew ? 'opened a ticket' : 'replied'}:\n\n${body}`,
        button: { label: 'Answer in Slate', url: appUrl(`/admin/support?ticket=${ticket.id}`) }
    })
}

/** Slate replied: tell whoever opened the ticket. */
export async function notifyCustomer(ticket: { id: string, siteId: string, subject: string, siteName: string, openedByEmail: string | null }, body: string) {
    if (!ticket.openedByEmail) return
    await sendEmail({
        to: ticket.openedByEmail,
        fromName: 'Slate support',
        subject: `Re: ${ticket.subject}`,
        text: `We’ve replied to your support ticket about ${ticket.siteName}:\n\n${body}`,
        button: { label: 'Read and reply', url: appUrl(`/sites/${ticket.siteId}/support?ticket=${ticket.id}`) }
    })
}

export function requirePlatformAdmin(user: { isPlatformAdmin?: boolean | null }) {
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
}

/** Slate replies on this site's tickets that nobody on the site has opened yet. */
export async function unreadSupport(siteId: string) {
    const r = await useDb().execute<{ n: number }>(sql`
        select count(*)::int n from support_tickets t
        where t.site_id = ${siteId} and exists(select 1 from support_messages m where m.ticket_id = t.id and m.from_slate and m.created_at > coalesce(t.customer_seen_at, 'epoch'))`)
    return Number(r.rows[0]?.n ?? 0)
}

export async function markSeenBySite(ticketId: string) {
    await useDb().update(schema.supportTickets).set({ customerSeenAt: new Date() }).where(eq(schema.supportTickets.id, ticketId))
}
