/** After returning from Checkout: pull the subscription now rather than waiting for the webhook. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'owner')
    if (site.billingUserId !== user.id) return await siteBilling(site, user.id)
    const { account } = await loadPayer(user.id)
    if (account?.stripeCustomerId) {
        const subs = await stripe<{ data: Record<string, any>[] }>('GET', 'subscriptions', { customer: account.stripeCustomerId, status: 'all', limit: 5 })
        const plans = subs.data.filter(s => s.metadata?.kind !== 'domain')
        const current = plans.find(s => !['canceled', 'incomplete_expired'].includes(s.status)) ?? plans[0]
        if (current) await syncSubscription(current)
    }
    return await siteBilling(site, user.id)
})
