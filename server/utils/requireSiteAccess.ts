import { and, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

/**
 * The access check. Call it first in every API route that touches a site.
 * Platform admins pass everywhere; anyone else needs a site_members row with at least `minRole`.
 * A site you can't see answers 404, not 403, so site ids can't be probed.
 */
export async function requireSiteAccess(event: H3Event, siteId: string, minRole: SiteRole = 'viewer') {
    const user = await requireUser(event)
    if (!/^[0-9a-f-]{36}$/i.test(siteId)) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

    const db = useDb()
    if (user.isPlatformAdmin) {
        const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, siteId) })
        if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
        return { user, site, role: 'owner' as SiteRole }
    }

    const rows = await db
        .select({ site: schema.sites, role: schema.siteMembers.role })
        .from(schema.siteMembers)
        .innerJoin(schema.sites, eq(schema.sites.id, schema.siteMembers.siteId))
        .where(and(eq(schema.siteMembers.siteId, siteId), eq(schema.siteMembers.userId, user.id)))
        .limit(1)

    const row = rows[0]
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    if (ROLE_RANK[row.role] < ROLE_RANK[minRole]) {
        throw createError({ statusCode: 403, statusMessage: 'Your role on this site can’t do that' })
    }
    return { user, site: row.site, role: row.role }
}
