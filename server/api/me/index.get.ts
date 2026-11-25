import { and, eq, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<Me | null> => {
    const user = await getSessionUser(event)
    if (!user) return null

    const db = useDb()
    const base = db
        .select({
            id: schema.sites.id,
            name: schema.sites.name,
            slug: schema.sites.slug,
            customDomain: schema.sites.customDomain,
            role: schema.siteMembers.role
        })
        .from(schema.sites)

    const sites = user.isPlatformAdmin
        ? (await db.select({ id: schema.sites.id, name: schema.sites.name, slug: schema.sites.slug, customDomain: schema.sites.customDomain }).from(schema.sites).where(isNull(schema.sites.deletedAt)).orderBy(schema.sites.name))
            .map(s => ({ ...s, role: 'owner' as SiteRole }))
        : await base
            .innerJoin(schema.siteMembers, eq(schema.siteMembers.siteId, schema.sites.id))
            .where(and(eq(schema.siteMembers.userId, user.id), isNull(schema.sites.deletedAt)))
            .orderBy(schema.sites.name)

    return { id: user.id, name: user.name, email: user.email, emailVerified: !!user.emailVerified, isPlatformAdmin: !!user.isPlatformAdmin, sites }
})
