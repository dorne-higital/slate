import { and, eq } from 'drizzle-orm'

/** Puts an earlier version back as the draft. Nothing changes for visitors until the page is published again. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const pageId = getRouterParam(event, 'pageId')!
    const versionId = getRouterParam(event, 'versionId')!
    if (!isUuid(pageId) || !isUuid(versionId)) throw createError({ statusCode: 404, statusMessage: 'Version not found' })
    const version = await useDb().query.pageVersions.findFirst({
        where: and(eq(schema.pageVersions.id, versionId), eq(schema.pageVersions.pageId, pageId), eq(schema.pageVersions.siteId, site.id))
    })
    if (!version) throw createError({ statusCode: 404, statusMessage: 'Version not found' })
    const [page] = await useDb().update(schema.pages)
        .set({ blocks: cleanBlocks(version.blocks), updatedAt: new Date(), updatedBy: user.id })
        .where(and(eq(schema.pages.id, pageId), eq(schema.pages.siteId, site.id)))
        .returning()
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    return toEditorPage(page)
})
