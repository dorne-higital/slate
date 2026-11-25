import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb().select().from(schema.domainOrders).where(eq(schema.domainOrders.siteId, site.id)).orderBy(desc(schema.domainOrders.createdAt))
    return rows.filter(o => o.status !== 'pending_payment' || Date.now() - o.createdAt.getTime() < 3600 * 1000).map(toOrderItem)
})
