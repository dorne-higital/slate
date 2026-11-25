import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

/** The Slate-bought domain whose email forwarding is being changed: on this site, live, with its own zone. */
export async function forwardingOrder(event: H3Event, minRole: SiteRole) {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, minRole)
    const orderId = getRouterParam(event, 'orderId')!
    if (!isUuid(orderId)) throw createError({ statusCode: 404, statusMessage: 'Domain not found' })
    const order = await useDb().query.domainOrders.findFirst({ where: and(eq(schema.domainOrders.id, orderId), eq(schema.domainOrders.siteId, site.id)) })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Domain not found' })
    if (order.simulated || order.status !== 'active' || !order.cloudflareZoneId || !domainZonesEnabled()) {
        throw createError({ statusCode: 400, statusMessage: 'Email forwarding works once the domain is fully set up. If it’s been more than a day, ask us from Support.' })
    }
    return { site, order, zoneId: order.cloudflareZoneId, apex: order.domainName }
}
