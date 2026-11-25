import { and, asc, eq } from 'drizzle-orm'

/** Disconnects a domain from Slate and Cloudflare. If it was the main one, another takes over. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const hostname = decodeURIComponent(getRouterParam(event, 'hostname')!)
    const db = useDb()
    const row = await db.query.domains.findFirst({ where: and(eq(schema.domains.hostname, hostname), eq(schema.domains.siteId, site.id)) })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'That domain isn’t connected to this site' })

    if (row.cloudflareId) await deleteCustomHostname(row.cloudflareId)
    await db.delete(schema.domains).where(eq(schema.domains.hostname, hostname))

    if (site.customDomain === hostname) {
        const next = await db.query.domains.findFirst({ where: eq(schema.domains.siteId, site.id), orderBy: asc(schema.domains.createdAt) })
        site.customDomain = next?.hostname ?? null
        await db.update(schema.sites).set({ customDomain: site.customDomain, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    }
    return await loadSiteDomains(site)
})
