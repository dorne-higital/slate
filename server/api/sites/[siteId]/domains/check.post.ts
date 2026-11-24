import { eq } from 'drizzle-orm'

/** "Check again": refreshes every domain on the site from Cloudflare. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb().select().from(schema.domains).where(eq(schema.domains.siteId, site.id))
    await Promise.all(rows.map(refreshDomain))
    return await loadSiteDomains(site)
})
