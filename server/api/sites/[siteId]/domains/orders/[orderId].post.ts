import { and, eq } from 'drizzle-orm'

/** Back from Checkout: if Stripe says it's paid, set the domain up now (the webhook may be slower). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'owner')
    const id = getRouterParam(event, 'orderId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    const db = useDb()
    const order = await db.query.domainOrders.findFirst({ where: and(eq(schema.domainOrders.id, id), eq(schema.domainOrders.siteId, site.id)) })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (order.status === 'pending_payment' && order.stripeSessionId) {
        const session = await stripe('GET', `checkout/sessions/${order.stripeSessionId}`)
        if (session.status === 'complete' && session.payment_status !== 'unpaid') await fulfilDomainOrder(order.id, session)
    }
    return toOrderItem((await db.query.domainOrders.findFirst({ where: eq(schema.domainOrders.id, id) }))!)
})
