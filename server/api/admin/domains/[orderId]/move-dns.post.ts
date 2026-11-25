import { eq } from 'drizzle-orm'

/** Moves a domain Slate registered (before domain zones existed) onto its own Cloudflare zone. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = getRouterParam(event, 'orderId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (!domainZonesEnabled()) throw createError({ statusCode: 503, statusMessage: 'Add the Cloudflare domains token first (NUXT_CLOUDFLARE_DOMAINS_TOKEN).' })
    const order = await useDb().query.domainOrders.findFirst({ where: eq(schema.domainOrders.id, id) })
    if (!order || order.simulated || (order.status !== 'active' && order.status !== 'cancelled')) {
        throw createError({ statusCode: 409, statusMessage: 'Only real domains that are set up can be moved.' })
    }
    try {
        await moveDomainToZone(order)
    } catch (err) {
        throw createError({ statusCode: 502, statusMessage: (err as Error).message.slice(0, 300) })
    }
    return { ok: true }
})
