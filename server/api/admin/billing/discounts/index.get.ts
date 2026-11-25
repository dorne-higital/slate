/** Discount codes (Stripe promotion codes) people can enter when they choose a plan. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    if (!stripeConfigured()) return []
    const list = await adminStripe<{ data: Record<string, any>[] }>('GET', 'promotion_codes', { limit: 100, expand: ['data.coupon'] })
    // Stripe can't delete codes; hide switched-off ones whose discount was deleted
    return list.data.filter(p => p.active || p.coupon?.valid !== false).map(toDiscount)
})
