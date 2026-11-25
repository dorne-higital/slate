import { eq } from 'drizzle-orm'

/** Choose a plan: sends the payer to Stripe Checkout. People already paying change plan in the portal. */
export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')!
    const { site, user } = await requireSiteAccess(event, siteId, 'owner')
    const { plan, interval } = await readBody<{ plan?: PlanKey, interval?: BillingInterval }>(event)
    if (!findPlan(plan) || (interval !== 'month' && interval !== 'year')) throw createError({ statusCode: 400, statusMessage: 'Pick a plan' })
    if (!site.billingUserId) throw createError({ statusCode: 400, statusMessage: 'This site doesn’t need a plan' })
    if (site.billingUserId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Only the person who pays for this site can change its plan' })
    if (plan !== 'studio' && await billedSiteCount(user.id) > 1) {
        throw createError({ statusCode: 400, statusMessage: 'You have more than one site, so you need the Studio plan. Delete the extra sites first to choose a smaller plan.' })
    }

    const db = useDb()
    await startTrial(user.id)
    const { account } = await loadPayer(user.id)
    if (account?.stripeSubscriptionId) return { url: await portalUrl(account.stripeCustomerId!, siteId) }

    let customerId = account?.stripeCustomerId
    if (!customerId) {
        const customer = await stripe('POST', 'customers', { email: user.email, name: user.name, metadata: { userId: user.id } })
        customerId = customer.id as string
        await db.update(schema.billingAccounts).set({ stripeCustomerId: customerId, updatedAt: new Date() }).where(eq(schema.billingAccounts.userId, user.id))
    }
    // A special price agreed with Slate replaces the list price for that plan and interval
    const special = account?.customPriceId && account.customPlan === plan && account.customInterval === interval ? account.customPriceId : null
    const prices = special ? { data: [{ id: special }] } : await stripe<{ data: { id: string }[] }>('GET', 'prices', { lookup_keys: [priceLookupKey(plan!, interval)], active: true })
    if (!prices.data[0]) throw createError({ statusCode: 503, statusMessage: 'That plan isn’t available right now. Please try again later.' })

    const session = await stripe('POST', 'checkout/sessions', {
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.id,
        line_items: [{ price: prices.data[0].id, quantity: 1 }],
        subscription_data: { metadata: { userId: user.id } },
        customer_update: { name: 'auto', address: 'auto' },
        billing_address_collection: 'auto',
        tax_id_collection: { enabled: true },
        allow_promotion_codes: true,
        // A 100%-off code needs no card
        payment_method_collection: 'if_required',
        success_url: appUrl(`/sites/${siteId}/billing?done=1`),
        cancel_url: appUrl(`/sites/${siteId}/billing`)
    })
    return { url: session.url as string }
})
