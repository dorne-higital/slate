/** Open a support ticket for this site. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const b = await readBody<{ subject?: string, body?: string }>(event)
    const subject = String(b.subject ?? '').trim().slice(0, 160)
    if (!subject) throw createError({ statusCode: 400, statusMessage: 'Give your question a short subject' })
    const body = cleanMessage(b.body)
    const [ticket] = await useDb().insert(schema.supportTickets).values({ siteId: site.id, openedBy: user.id, subject }).returning({ id: schema.supportTickets.id })
    await addMessage(ticket!.id, user.id, body, false)
    await markSeenBySite(ticket!.id)
    event.waitUntil?.(notifySlate({ id: ticket!.id, subject, siteName: site.name }, user.name, body, true))
    return await loadTicket(ticket!.id, site.id)
})
