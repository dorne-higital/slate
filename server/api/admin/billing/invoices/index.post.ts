import { eq } from 'drizzle-orm'

/** A one-off invoice for a site's client: Stripe makes it and hosts the pay page, Slate emails the link. */
export default defineEventHandler(async (event) => {
    const admin = await requireUser(event)
    requirePlatformAdmin(admin)
    const b = await readBody<{ siteId?: string, items?: { description?: string, amount?: number }[], daysUntilDue?: number, note?: string }>(event)
    const site = isUuid(b.siteId ?? '') ? await useDb().query.sites.findFirst({ where: eq(schema.sites.id, b.siteId!) }) : null
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 20)
        .map(i => ({ description: String(i.description ?? '').trim().slice(0, 200), amount: Math.round(Number(i.amount)) }))
        .filter(i => i.description || i.amount)
    if (!items.length) throw createError({ statusCode: 400, statusMessage: 'Add at least one line' })
    if (items.some(i => !i.description || !Number.isFinite(i.amount) || i.amount < 1 || i.amount > 10_000_000)) {
        throw createError({ statusCode: 400, statusMessage: 'Every line needs a description and an amount above 0' })
    }
    const days = Math.min(90, Math.max(0, Math.round(Number(b.daysUntilDue ?? 14))))
    const note = String(b.note ?? '').trim().slice(0, 500)

    const who = await billableUser(site)
    if (!who) throw createError({ statusCode: 400, statusMessage: 'Only platform admins own this site, and admins are never billed. Invite the client as an owner first.' })
    const customer = await ensureCustomer(who.user)
    const inv = await adminStripe('POST', 'invoices', {
        customer, collection_method: 'send_invoice', days_until_due: days, auto_advance: false,
        pending_invoice_items_behavior: 'exclude', currency: 'gbp', description: note || undefined,
        metadata: { kind: 'custom', siteId: site.id }
    })
    for (const i of items) await adminStripe('POST', 'invoiceitems', { customer, invoice: inv.id, amount: i.amount, currency: 'gbp', description: i.description })
    const final = await adminStripe('POST', `invoices/${inv.id}/finalize`, { auto_advance: false })

    const [row] = await useDb().insert(schema.customInvoices).values({
        siteId: site.id, userId: who.user.id, stripeInvoiceId: final.id, number: final.number ?? null,
        description: items.map(i => i.description).join(', ').slice(0, 300), total: final.total, status: final.status,
        hostedUrl: final.hosted_invoice_url ?? null, pdfUrl: final.invoice_pdf ?? null,
        dueAt: final.due_date ? new Date(final.due_date * 1000) : null, createdBy: admin.id
    }).returning()
    await sendInvoiceEmail(who.user, site.name, row!)
    return toAdminInvoice(row!)
})
