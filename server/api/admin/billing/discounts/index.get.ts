/** Discount codes (Stripe promotion codes) people can enter when they choose a plan. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    if (!stripeConfigured()) return []
    const list = await adminStripe<{ data: Record<string, any>[] }>('GET', 'promotion_codes', { limit: 100, expand: ['data.coupon'] })
    return list.data.map(toDiscount)
})
