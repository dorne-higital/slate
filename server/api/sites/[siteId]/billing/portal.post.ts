/** Stripe's customer portal: change plan, card, billing details, cancel, invoices. */
export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')!
    const { site, user } = await requireSiteAccess(event, siteId, 'owner')
    if (site.billingUserId !== user.id) throw createError({ statusCode: 403, statusMessage: 'Only the person who pays for this site can manage billing' })
    const { account } = await loadPayer(user.id)
    if (!account?.stripeCustomerId) throw createError({ statusCode: 400, statusMessage: 'Choose a plan first' })
    return { url: await portalUrl(account.stripeCustomerId, siteId) }
})
