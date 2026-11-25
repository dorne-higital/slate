import { eq } from 'drizzle-orm'

/** Cancels an unpaid custom invoice. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = String(getRouterParam(event, 'invoiceId'))
    const row = isUuid(id) ? await useDb().query.customInvoices.findFirst({ where: eq(schema.customInvoices.id, id) }) : null
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Invoice not found' })
    if (row.status !== 'open') throw createError({ statusCode: 400, statusMessage: 'Only unpaid invoices can be cancelled' })
    const inv = await adminStripe('POST', `invoices/${row.stripeInvoiceId}/void`)
    await useDb().update(schema.customInvoices).set({ status: inv.status }).where(eq(schema.customInvoices.id, row.id))
    return { ok: true }
})
