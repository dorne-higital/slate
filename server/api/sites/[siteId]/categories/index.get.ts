import { asc, eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    return await useDb()
        .select({
            id: schema.postCategories.id,
            name: schema.postCategories.name,
            slug: schema.postCategories.slug,
            postCount: sql<number>`(select count(*)::int from posts p where p.category_id = "post_categories"."id")`
        })
        .from(schema.postCategories)
        .where(eq(schema.postCategories.siteId, site.id))
        .orderBy(asc(schema.postCategories.name))
})
