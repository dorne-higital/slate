import { and, eq } from 'drizzle-orm'

interface PostPatch {
    title?: string
    slug?: string
    excerpt?: string
    coverImage?: string
    body?: string
    categoryId?: string | null
    /** 'draft' unpublishes; 'published' publishes now, or at publishedAt if given (scheduling) */
    status?: PageStatus
    publishedAt?: string | null
}

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const post = await requirePost(site.id, getRouterParam(event, 'postId')!)
    const b = await readBody<PostPatch>(event)
    const set: Partial<typeof schema.posts.$inferInsert> = { updatedAt: new Date() }

    if (b.title !== undefined) set.title = String(b.title).trim().slice(0, 160) || 'Untitled post'
    if (b.slug !== undefined) set.slug = await freePostSlug(site.id, String(b.slug) || set.title || post.title, post.id)
    if (b.excerpt !== undefined) set.excerpt = String(b.excerpt).trim().slice(0, 400) || null
    if (b.coverImage !== undefined) set.coverImage = safeUrl(String(b.coverImage).slice(0, 1000)) || null
    if (b.body !== undefined) set.body = String(b.body).slice(0, 100_000)
    if (b.categoryId !== undefined) {
        if (b.categoryId && isUuid(b.categoryId)) {
            const cat = await useDb().query.postCategories.findFirst({ where: and(eq(schema.postCategories.id, b.categoryId), eq(schema.postCategories.siteId, site.id)) })
            set.categoryId = cat?.id ?? null
        } else {
            set.categoryId = null
        }
    }
    if (b.status === 'draft') {
        set.status = 'draft'
    } else if (b.status === 'published') {
        const when = b.publishedAt ? new Date(b.publishedAt) : null
        set.status = 'published'
        set.publishedAt = when && !Number.isNaN(when.getTime()) ? when : (post.publishedAt ?? new Date())
    }

    const [updated] = await useDb().update(schema.posts).set(set).where(eq(schema.posts.id, post.id)).returning()
    // Newly live (not scheduled for later): tell search engines
    if (b.status === 'published' && post.status !== 'published' && updated!.publishedAt && updated!.publishedAt <= new Date()) {
        event.waitUntil?.(pingIndexNow(site, [`/blog/${updated!.slug}`]))
        // Posts on the guides site are slatecms.co.uk/guides pages
        if (site.id === useRuntimeConfig().marketingSiteId) event.waitUntil?.(pingMarketing([`/guides/${updated!.slug}`, '/guides']))
    }
    return toEditorPost(updated!)
})
