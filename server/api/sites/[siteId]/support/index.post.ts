/** Open a support ticket for this site: a type, the answers to that type's questions, a severity for bugs, and any extra detail. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const b = await readBody<{ subject?: string, body?: string, category?: string, severity?: string, answers?: unknown }>(event)
    const subject = String(b.subject ?? '').trim().slice(0, 160)
    if (!subject) throw createError({ statusCode: 400, statusMessage: 'Give it a short subject' })
    const category = findTicketCategory(b.category) ?? findTicketCategory('help')!
    const severity = category.key === 'bug' ? (TICKET_SEVERITIES.find(s => s.key === b.severity)?.key ?? null) : null
    if (category.key === 'bug' && !severity) throw createError({ statusCode: 400, statusMessage: 'Choose how bad the problem is' })
    const checked = cleanTicketAnswers(category, b.answers)
    if (!checked.ok) throw createError({ statusCode: 400, statusMessage: checked.message })
    const more = String(b.body ?? '').replace(/\r\n/g, '\n').trim().slice(0, 5000)
    if (!category.questions.some(q => q.kind === 'textarea' && q.required) && !more) throw createError({ statusCode: 400, statusMessage: 'Tell us a bit more' })
    const body = ticketSummary(category, severity, checked.answers, more)

    const [ticket] = await useDb().insert(schema.supportTickets).values({ siteId: site.id, openedBy: user.id, subject, category: category.key, severity, details: checked.answers }).returning({ id: schema.supportTickets.id })
    await addMessage(ticket!.id, user.id, body, false)
    await markSeenBySite(ticket!.id)
    const label = `[${severity ? severity.toUpperCase() + ' ' : ''}${category.name}] ${subject}`
    event.waitUntil?.(notifySlate({ id: ticket!.id, subject: label, siteName: site.name }, user.name, body, true))
    return await loadTicket(ticket!.id, site.id)
})
