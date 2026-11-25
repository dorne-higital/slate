import { eq } from 'drizzle-orm'

/** Try setting up a failed domain order again. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = getRouterParam(event, 'orderId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    await retryDomainOrder(id)
    const order = await useDb().query.domainOrders.findFirst({ where: eq(schema.domainOrders.id, id) })
    return { status: order?.status, error: order?.error ?? null }
})
