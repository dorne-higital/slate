/** A message from slatecms.co.uk/contact. Lands in the guides site's inbox and email like any form reply. */
export default defineEventHandler(async (event) => {
    const site = await marketingSite()
    const form = site ? await marketingContactForm(site.id) : null
    if (!site || !form) throw createError({ statusCode: 503, statusMessage: 'The contact form isn’t working right now. Please email hello@slatecms.co.uk instead.' })
    const body = await readBody<FormSubmission & { turnstile?: string }>(event)
    if (!await verifyTurnstile(body.turnstile, requestIp(event))) throw createError({ statusCode: 400, statusMessage: TURNSTILE_FAILED })
    return acceptFormReply(event, site, form, { ...body, page: '/contact' })
})
