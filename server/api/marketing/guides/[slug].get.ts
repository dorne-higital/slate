import { and, eq, lte } from 'drizzle-orm'

/** One live guide. Drafts and guides scheduled for later are "not found" (with a redirect if one is set up). */
export default defineEventHandler(async (event) => {
    const site = await marketingSite()
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Guide not found' })
    const slug = getRouterParam(event, 'slug')!
    const [row] = await useDb()
        .select({ post: schema.posts, categoryName: schema.postCategories.name, categorySlug: schema.postCategories.slug, authorName: schema.user.name })
        .from(schema.posts)
        .leftJoin(schema.postCategories, eq(schema.postCategories.id, schema.posts.categoryId))
        .leftJoin(schema.user, eq(schema.user.id, schema.posts.authorId))
        .where(and(eq(schema.posts.siteId, site.id), eq(schema.posts.slug, slug), eq(schema.posts.status, 'published'), lte(schema.posts.publishedAt, new Date())))
        .limit(1)
    if (!row) {
        const redirect = await findRedirect(event, site.id, `/blog/${slug}`)
        throw createError({ statusCode: 404, statusMessage: redirect ? 'Moved' : 'Guide not found', data: redirect ? { redirect: { ...redirect, to: redirect.to.replace(/^\/blog\//, '/guides/') } } : undefined })
    }
    const more = (await livePosts(site.id, { limit: 4 })).filter(p => p.slug !== slug).slice(0, 3)
    setResponseHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=600')
    return {
        post: {
            title: row.post.title,
            slug: row.post.slug,
            summary: postSummary(row.post),
            coverImage: row.post.coverImage,
            body: row.post.body,
            publishedAt: row.post.publishedAt!.toISOString(),
            updatedAt: row.post.updatedAt.toISOString(),
            minutes: readingMinutes(row.post.body),
            author: row.authorName ?? 'Slate',
            category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug! } : null
        },
        more
    }
})
