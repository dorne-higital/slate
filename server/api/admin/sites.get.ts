import { and, desc, eq, inArray, sql } from 'drizzle-orm'

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
            deletedAt: schema.sites.deletedAt,
            offline: schema.sites.offline,
            // Correlated subqueries reference "sites"."id" explicitly: a bare column would bind to the inner table
            pageCount: sql<number>`(select count(*)::int from pages p where p.site_id = "sites"."id")`,
            ownerName: sql<string | null>`(select u.name from site_members m join "user" u on u.id = m.user_id where m.site_id = "sites"."id" and m.role = 'owner' order by m.created_at limit 1)`,
            ownerEmail: sql<string | null>`(select u.email from site_members m join "user" u on u.id = m.user_id where m.site_id = "sites"."id" and m.role = 'owner' order by m.created_at limit 1)`,
            domainLive: sql<boolean>`exists(select 1 from domains d where d.hostname = "sites"."custom_domain" and d.status = 'active')`,
            billingUserId: schema.sites.billingUserId
        })
        .from(schema.sites)
        .orderBy(desc(schema.sites.createdAt))

    const [{ users } = { users: 0 }] = await db.select({ users: sql<number>`count(*)::int` }).from(schema.user)
    const { sitesDomain } = useRuntimeConfig().public

    // Each site's plan, from whoever pays for it
    const payers = [...new Set(rows.map(r => r.billingUserId).filter(Boolean))] as string[]
    const accounts = payers.length ? await db.select().from(schema.billingAccounts).where(inArray(schema.billingAccounts.userId, payers)) : []
    const admins = payers.length ? new Set((await db.select({ id: schema.user.id }).from(schema.user).where(and(inArray(schema.user.id, payers), eq(schema.user.isPlatformAdmin, true)))).map(u => u.id)) : new Set<string>()
    const planFor = (userId: string | null) => {
        if (!userId) return { status: 'comped' as BillingStatus, plan: null }
        const a = accounts.find(x => x.userId === userId)
        const status = accountStatus(a, admins.has(userId))
        return { status, plan: status === 'active' || status === 'past_due' ? findPlan(a?.plan)?.name ?? null : null }
    }

    return {
        totals: { sites: rows.length, users },
        sites: rows.map(({ billingUserId, ...r }) => ({
            ...r,
            billing: planFor(billingUserId),
            createdAt: r.createdAt.toISOString(),
            deletedAt: r.deletedAt?.toISOString() ?? null,
            address: r.domainLive && r.customDomain ? r.customDomain : `${r.slug}.${sitesDomain}`
        }))
    }
})
