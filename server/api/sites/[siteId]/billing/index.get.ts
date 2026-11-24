/** The site's plan, and for the person who pays: card, billing details and invoices from Stripe. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const billing = await siteBilling(site, user.id)
    const base = { billing, sitesUsed: site.billingUserId ? await billedSiteCount(site.billingUserId) : 1, card: null, details: null, invoices: [] as unknown[] }
    if (!billing.youPay || !stripeConfigured()) return base

    const { account } = await loadPayer(user.id)
    if (!account?.stripeCustomerId) return base
    const [customer, invoices, sub] = await Promise.all([
        stripe('GET', `customers/${account.stripeCustomerId}`, { expand: ['tax_ids', 'invoice_settings.default_payment_method'] }),
        stripe<{ data: Record<string, any>[] }>('GET', 'invoices', { customer: account.stripeCustomerId, limit: 12 }),
        account.stripeSubscriptionId ? stripe('GET', `subscriptions/${account.stripeSubscriptionId}`, { expand: ['default_payment_method'] }) : Promise.resolve(null)
    ])
    const pm = sub?.default_payment_method ?? customer.invoice_settings?.default_payment_method
    const a = customer.address
    return {
        ...base,
        card: pm?.card ? { brand: pm.card.brand, last4: pm.card.last4, expMonth: pm.card.exp_month, expYear: pm.card.exp_year } : null,
        details: {
            name: customer.name ?? '',
            address: a ? [a.line1, a.line2, a.city, a.postal_code].filter(Boolean).join(', ') : '',
            taxId: customer.tax_ids?.data?.[0]?.value ?? ''
        },
        nextPayment: sub && !sub.cancel_at_period_end ? { amount: sub.items?.data?.[0]?.price?.unit_amount ?? null, date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null } : null,
        invoices: invoices.data.filter(i => i.status !== 'draft').map(i => ({
            id: i.id,
            date: new Date(i.created * 1000).toISOString(),
            description: invoiceLine(i.lines?.data?.[0]),
            amount: i.total,
            status: i.status,
            pdf: i.invoice_pdf,
            url: i.hosted_invoice_url
        }))
    }
})

/** "Studio plan, yearly" from the price's lookup key, falling back to Stripe's own wording. */
function invoiceLine(line: Record<string, any> | undefined) {
    const m = /^slate_(starter|business|studio)_(monthly|yearly)$/.exec(line?.price?.lookup_key ?? '')
    return m ? `${findPlan(m[1])!.name} plan, ${m[2]}` : line?.description ?? 'Slate subscription'
}
