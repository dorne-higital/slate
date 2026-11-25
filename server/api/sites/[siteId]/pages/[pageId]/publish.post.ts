import { and, eq, sql } from 'drizzle-orm'

/** Makes the current draft what visitors see. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const pageId = getRouterParam(event, 'pageId')!
    if (!isUuid(pageId)) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    const now = new Date()
    const [page] = await useDb()
        .update(schema.pages)
        .set({ status: 'published', publishedBlocks: sql`${schema.pages.blocks}`, publishedAt: now, updatedAt: now, updatedBy: user.id })
        .where(and(eq(schema.pages.id, pageId), eq(schema.pages.siteId, site.id)))
        .returning()
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    if (!page.noIndex) event.waitUntil?.(pingIndexNow(site, [page.path]))
    return toEditorPage(page)
})
