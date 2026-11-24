/** Switches a code off. People already using it keep their discount. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = String(getRouterParam(event, 'discountId'))
    if (!/^promo_\w+$/.test(id)) throw createError({ statusCode: 404, statusMessage: 'Code not found' })
    await adminStripe('POST', `promotion_codes/${id}`, { active: false })
    return { ok: true }
})
