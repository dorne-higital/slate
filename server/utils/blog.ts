import { and, desc, eq, lte } from 'drizzle-orm'

export async function requirePost(siteId: string, postId: string) {
    if (!isUuid(postId)) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    const post = await useDb().query.posts.findFirst({ where: and(eq(schema.posts.id, postId), eq(schema.posts.siteId, siteId)) })
    if (!post) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    return post
}

export function toEditorPost(p: typeof schema.posts.$inferSelect) {
    return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt ?? '',
        coverImage: p.coverImage ?? '',
        body: p.body,
        categoryId: p.categoryId,
        status: p.status,
        publishedAt: p.publishedAt?.toISOString() ?? null,
        state: postState({ status: p.status, publishedAt: p.publishedAt }),
        updatedAt: p.updatedAt.toISOString()
    }
}

/** A slug unique within the site, from the title, avoiding `exceptId` (the post being renamed). */
export async function freePostSlug(siteId: string, wanted: string, exceptId?: string) {
    const base = slugify(wanted) || 'post'
    for (let n = 1; n < 100; n++) {
        const slug = n === 1 ? base : `${base}-${n}`
        const clash = await useDb().query.posts.findFirst({ where: and(eq(schema.posts.siteId, siteId), eq(schema.posts.slug, slug)), columns: { id: true } })
        if (!clash || clash.id === exceptId) return slug
    }
    return `${base}-${crypto.randomUUID().slice(0, 6)}`
}

/** Posts visitors can see right now, newest first, with their category. */
export async function livePosts(siteId: string, opts: { limit?: number, categoryId?: string | null } = {}) {
    const filters = [eq(schema.posts.siteId, siteId), eq(schema.posts.status, 'published'), lte(schema.posts.publishedAt, new Date())]
    if (opts.categoryId) filters.push(eq(schema.posts.categoryId, opts.categoryId))
    const rows = await useDb()
        .select({ post: schema.posts, categoryName: schema.postCategories.name, categorySlug: schema.postCategories.slug })
        .from(schema.posts)
        .leftJoin(schema.postCategories, eq(schema.postCategories.id, schema.posts.categoryId))
        .where(and(...filters))
        .orderBy(desc(schema.posts.publishedAt))
        .limit(opts.limit ?? 50)
    return rows.map(r => ({
        title: r.post.title,
        slug: r.post.slug,
        summary: postSummary(r.post),
        coverImage: r.post.coverImage,
        publishedAt: r.post.publishedAt!.toISOString(),
        category: r.categoryName ? { name: r.categoryName, slug: r.categorySlug! } : null
    }))
}

export type PublicPostSummary = Awaited<ReturnType<typeof livePosts>>[number]

/** The header, footer and look every public page needs. */
export async function publicShell(site: typeof schema.sites.$inferSelect) {
    const [menus, address] = await Promise.all([loadMenus(site.id), liveAddress(site)])
    return {
        site: { name: site.name, theme: site.theme ?? {}, seo: site.seo ?? {}, integrations: site.integrations ?? {}, address },
        menus: { header: menus.header, footer: menus.footer, legal: menus.legal }
    }
}
