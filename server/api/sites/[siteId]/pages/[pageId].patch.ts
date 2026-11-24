import { and, eq } from 'drizzle-orm'

interface PatchBody {
    title?: string
    blocks?: unknown
    seoTitle?: string | null
    seoDescription?: string | null
    shareImage?: string | null
    noIndex?: boolean
}

/** Saves the draft. Visitors don't see any of this until the page is published. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const pageId = getRouterParam(event, 'pageId')!
    if (!isUuid(pageId)) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const body = await readBody<PatchBody>(event)

    const changes: Partial<typeof schema.pages.$inferInsert> = { updatedAt: new Date(), updatedBy: user.id }
    if (body.title !== undefined) {
        const title = String(body.title).trim().slice(0, 120)
        if (!title) throw createError({ statusCode: 400, statusMessage: 'A page needs a title' })
        changes.title = title
    }
    if (body.blocks !== undefined) changes.blocks = cleanBlocks(body.blocks)
    if (body.seoTitle !== undefined) changes.seoTitle = body.seoTitle ? String(body.seoTitle).slice(0, 120) : null
    if (body.seoDescription !== undefined) changes.seoDescription = body.seoDescription ? String(body.seoDescription).slice(0, 320) : null
    if (body.shareImage !== undefined) changes.shareImage = body.shareImage ? safeUrl(String(body.shareImage).slice(0, 1000)) || null : null
    if (body.noIndex !== undefined) changes.noIndex = body.noIndex === true

    const [page] = await useDb()
        .update(schema.pages)
        .set(changes)
        .where(and(eq(schema.pages.id, pageId), eq(schema.pages.siteId, site.id)))
        .returning()
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    return toEditorPage(page)
})
