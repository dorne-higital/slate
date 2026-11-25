import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb().select().from(schema.redirects).where(eq(schema.redirects.siteId, site.id)).orderBy(desc(schema.redirects.createdAt))
    return rows.map(toRedirectItem)
})
