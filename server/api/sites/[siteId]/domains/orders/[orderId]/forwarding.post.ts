const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Adds a forward: { local: 'hello' or '*', to: 'someone@gmail.com' }. */
export default defineEventHandler(async (event) => {
    const { zoneId, apex } = await forwardingOrder(event, 'admin')
    const body = await readBody<{ local?: string, to?: string }>(event)
    const local = String(body.local ?? '').trim().toLowerCase()
    const to = String(body.to ?? '').trim().toLowerCase()
    if (local !== '*' && !/^[a-z0-9](?:[a-z0-9._+-]{0,62}[a-z0-9])?$/.test(local)) {
        throw createError({ statusCode: 400, statusMessage: 'Use letters, numbers, dots or dashes for the address, like hello or bookings.' })
    }
    if (!EMAIL.test(to) || to.length > 200) throw createError({ statusCode: 400, statusMessage: 'Enter the email address it should go to.' })
    if (to.endsWith(`@${apex}`)) throw createError({ statusCode: 400, statusMessage: 'Forward it to an inbox on a different domain, like Gmail or Outlook.' })
    const existing = await listEmailForwards(zoneId, apex)
    if (existing.length >= 20) throw createError({ statusCode: 400, statusMessage: 'That’s the most forwards a domain can have. Remove one first.' })
    if (existing.some(f => f.from === (local === '*' ? '*' : `${local}@${apex}`))) throw createError({ statusCode: 400, statusMessage: 'That address already forwards somewhere. Remove it first to change it.' })
    try {
        await addEmailForward(zoneId, apex, local, to)
    } catch (err) {
        console.error('[forwarding]', err)
        throw createError({ statusCode: 502, statusMessage: 'Couldn’t set that up just now. Please try again in a minute.' })
    }
    return listEmailForwards(zoneId, apex)
})
