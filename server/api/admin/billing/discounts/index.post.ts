/** Makes a discount code: a Stripe coupon plus a code people type at checkout. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const b = await readBody<{ code?: string, kind?: string, value?: number, duration?: string, months?: number, maxUses?: number | null, expiresOn?: string | null }>(event)
    const code = String(b.code ?? '').trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw createError({ statusCode: 400, statusMessage: 'Codes are 3 to 30 letters or numbers, no spaces' })
    const value = Number(b.value)
    const kind = b.kind === 'amount' ? 'amount' : 'percent'
    if (kind === 'percent' && !(value > 0 && value <= 100)) throw createError({ statusCode: 400, statusMessage: 'A percentage is between 1 and 100' })
    if (kind === 'amount' && !(value >= 1 && value <= 1_000_000)) throw createError({ statusCode: 400, statusMessage: 'Enter an amount off of at least 1p' })
    const duration = ['once', 'forever', 'repeating'].includes(String(b.duration)) ? String(b.duration) : 'once'
    const months = Math.round(Number(b.months))
    if (duration === 'repeating' && !(months >= 1 && months <= 36)) throw createError({ statusCode: 400, statusMessage: 'Choose 1 to 36 months' })
    const maxUses = b.maxUses ? Math.round(Number(b.maxUses)) : null
    const expires = b.expiresOn ? Math.floor(new Date(`${b.expiresOn}T23:59:59Z`).getTime() / 1000) : null
    if (expires !== null && (!Number.isFinite(expires) || expires * 1000 < Date.now())) throw createError({ statusCode: 400, statusMessage: 'The end date must be in the future' })

    const taken = await adminStripe<{ data: unknown[] }>('GET', 'promotion_codes', { code, limit: 1 })
    if (taken.data.length) throw createError({ statusCode: 409, statusMessage: 'That code already exists. Pick another.' })
    const coupon = await adminStripe('POST', 'coupons', {
        name: code, duration, duration_in_months: duration === 'repeating' ? months : undefined,
        ...(kind === 'percent' ? { percent_off: value } : { amount_off: Math.round(value), currency: 'gbp' })
    })
    const promo = await adminStripe('POST', 'promotion_codes', { coupon: coupon.id, code, max_redemptions: maxUses || undefined, expires_at: expires || undefined, expand: ['coupon'] })
    return toDiscount(promo)
})
