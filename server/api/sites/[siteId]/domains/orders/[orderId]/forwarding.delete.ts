/** Removes one forward: ?id=… (from the list; 'catch_all' for the catch-all). */
export default defineEventHandler(async (event) => {
    const { zoneId, apex } = await forwardingOrder(event, 'admin')
    const id = String(getQuery(event).id ?? '')
    const existing = await listEmailForwards(zoneId, apex)
    if (!existing.some(f => f.id === id)) throw createError({ statusCode: 404, statusMessage: 'That forward has already gone.' })
    await removeEmailForward(zoneId, id)
    return listEmailForwards(zoneId, apex)
})
