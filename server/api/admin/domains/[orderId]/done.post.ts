import { and, eq } from 'drizzle-orm'

/** A failed order was finished by hand at name.com: mark it as the customer's. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = getRouterParam(event, 'orderId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    const db = useDb()
    const order = await db.query.domainOrders.findFirst({ where: eq(schema.domainOrders.id, id) })
    if (!order || order.status !== 'failed') throw createError({ statusCode: 409, statusMessage: 'Only orders that need help can be marked as done.' })
    const owned = order.simulated ? null : await ownedDomain(order.domainName)
    await db.update(schema.domainOrders)
        .set({ status: 'active', error: null, expiresAt: owned?.expiresAt ?? order.expiresAt ?? new Date(Date.now() + 365 * 24 * 3600 * 1000), updatedAt: new Date() })
        .where(and(eq(schema.domainOrders.id, id), eq(schema.domainOrders.status, 'failed')))
    return { ok: true }
})
