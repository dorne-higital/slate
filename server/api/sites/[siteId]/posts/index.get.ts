import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb()
        .select({ post: schema.posts, categoryName: schema.postCategories.name, authorName: schema.user.name })
        .from(schema.posts)
        .leftJoin(schema.postCategories, eq(schema.postCategories.id, schema.posts.categoryId))
        .leftJoin(schema.user, eq(schema.user.id, schema.posts.authorId))
        .where(eq(schema.posts.siteId, site.id))
        .orderBy(desc(schema.posts.updatedAt))
    return rows.map(r => ({ ...toEditorPost(r.post), categoryName: r.categoryName, authorName: r.authorName }))
})
