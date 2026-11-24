import { desc, sql } from 'drizzle-orm'

/** Every site on Slate, for platform admins only. Anyone else gets a 404, as if the route didn't exist. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })

    const db = useDb()
    const rows = await db
        .select({
            id: schema.sites.id,
            name: schema.sites.name,
            slug: schema.sites.slug,
            customDomain: schema.sites.customDomain,
            createdAt: schema.sites.createdAt,
            // Correlated subqueries reference "sites"."id" explicitly: a bare column would bind to the inner table
            pageCount: sql<number>`(select count(*)::int from pages p where p.site_id = "sites"."id")`,
            ownerName: sql<string | null>`(select u.name from site_members m join "user" u on u.id = m.user_id where m.site_id = "sites"."id" and m.role = 'owner' order by m.created_at limit 1)`,
            ownerEmail: sql<string | null>`(select u.email from site_members m join "user" u on u.id = m.user_id where m.site_id = "sites"."id" and m.role = 'owner' order by m.created_at limit 1)`,
            domainLive: sql<boolean>`exists(select 1 from domains d where d.hostname = "sites"."custom_domain" and d.status = 'active')`
        })
        .from(schema.sites)
        .orderBy(desc(schema.sites.createdAt))

    const [{ users } = { users: 0 }] = await db.select({ users: sql<number>`count(*)::int` }).from(schema.user)
    const { sitesDomain } = useRuntimeConfig().public

    return {
        totals: { sites: rows.length, users },
        sites: rows.map(r => ({
            ...r,
            createdAt: r.createdAt.toISOString(),
            address: r.domainLive && r.customDomain ? r.customDomain : `${r.slug}.${sitesDomain}`
        }))
    }
})
