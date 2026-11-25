/** Email forwards on a domain bought through Slate. */
export default defineEventHandler(async (event) => {
    const { zoneId, apex } = await forwardingOrder(event, 'admin')
    return listEmailForwards(zoneId, apex)
})
