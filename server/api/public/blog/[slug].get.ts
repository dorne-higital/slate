import { and, eq, lte } from 'drizzle-orm'

/** One live post on the site for this Host. Drafts and not-yet-due scheduled posts are "not found". */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const slug = getRouterParam(event, 'slug')!
    const db = useDb()

    const [row] = await db
        .select({ post: schema.posts, categoryName: schema.postCategories.name, categorySlug: schema.postCategories.slug, authorName: schema.user.name })
        .from(schema.posts)
        .leftJoin(schema.postCategories, eq(schema.postCategories.id, schema.posts.categoryId))
        .leftJoin(schema.user, eq(schema.user.id, schema.posts.authorId))
        .where(and(eq(schema.posts.siteId, site.id), eq(schema.posts.slug, slug), eq(schema.posts.status, 'published'), lte(schema.posts.publishedAt, new Date())))
        .limit(1)
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Post not found' })

    const [shell, more] = await Promise.all([publicShell(site), livePosts(site.id, { limit: 4 })])
    setResponseHeader(event, 'cache-control', 'public, max-age=30, stale-while-revalidate=300')
    return {
        ...shell,
        post: {
            title: row.post.title,
            slug: row.post.slug,
            summary: postSummary(row.post),
            coverImage: row.post.coverImage,
            body: row.post.body,
            publishedAt: row.post.publishedAt!.toISOString(),
            minutes: readingMinutes(row.post.body),
            author: row.authorName?.split(' ')[0] ?? null,
            category: row.categoryName ? { name: row.categoryName, slug: row.categorySlug! } : null
        },
        more: more.filter(p => p.slug !== slug).slice(0, 3)
    }
})
