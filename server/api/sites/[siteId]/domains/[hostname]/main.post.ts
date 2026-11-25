import { and, eq } from 'drizzle-orm'

/** Makes this the main domain. The site's other domains send visitors here. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const hostname = decodeURIComponent(getRouterParam(event, 'hostname')!)
    const db = useDb()
    const row = await db.query.domains.findFirst({ where: and(eq(schema.domains.hostname, hostname), eq(schema.domains.siteId, site.id)) })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'That domain isn’t connected to this site' })

    await db.update(schema.sites).set({ customDomain: hostname, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    site.customDomain = hostname
    return await loadSiteDomains(site)
})
