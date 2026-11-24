import { eq } from 'drizzle-orm'

/** Buy a domain for this site: checks it again, then sends the owner to Stripe for a yearly payment. */
export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')!
    const { site, user } = await requireSiteAccess(event, siteId, 'owner')
    const { domain } = await readBody<{ domain?: string }>(event)
    const name = normaliseDomain(String(domain ?? ''))
    if (!name) throw createError({ statusCode: 400, statusMessage: 'Pick a domain' })
    const [checked] = await checkDomains([name])
    if (!checked!.option.available) throw createError({ statusCode: 409, statusMessage: `${name} can’t be bought: ${checked!.option.reason?.toLowerCase()}.` })

    const db = useDb()
    await startTrial(user.id)
    const { account } = await loadPayer(user.id)
    let customerId = account?.stripeCustomerId
    if (!customerId) {
        customerId = (await stripe('POST', 'customers', { email: user.email, name: user.name, metadata: { userId: user.id } })).id as string
        await db.update(schema.billingAccounts).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(schema.billingAccounts.userId, user.id))
    }

    const price = checked!.option.price!
    const [order] = await db.insert(schema.domainOrders).values({ siteId: site.id, userId: user.id, domainName: name, price, simulated: !domainRegistrationLive() }).returning()
    const session = await stripe('POST', 'checkout/sessions', {
        mode: 'subscription',
        customer: customerId,
        line_items: [{ quantity: 1, price_data: { currency: 'gbp', unit_amount: price, recurring: { interval: 'year' }, product_data: { name: `Domain: ${name}` } } }],
        metadata: { kind: 'domain', orderId: order!.id },
        subscription_data: { metadata: { kind: 'domain', orderId: order!.id, domain: name } },
        // The domain is registered in the customer's name, so we need their full details
        billing_address_collection: 'required',
        phone_number_collection: { enabled: true },
        customer_update: { name: 'auto', address: 'auto' },
        success_url: appUrl(`/sites/${siteId}/domains?order=${order!.id}`),
        cancel_url: appUrl(`/sites/${siteId}/domains`)
    })
    await db.update(schema.domainOrders).set({ stripeSessionId: session.id }).where(eq(schema.domainOrders.id, order!.id))
    return { url: session.url as string }
})
