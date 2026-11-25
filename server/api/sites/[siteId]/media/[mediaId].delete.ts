import { and, eq } from 'drizzle-orm'

/** Deletes a file. Pages still pointing at it will show a broken image until it's replaced. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const id = getRouterParam(event, 'mediaId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'File not found' })
    const [row] = await useDb().delete(schema.media).where(and(eq(schema.media.id, id), eq(schema.media.siteId, site.id))).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'File not found' })
    await useMediaStorage().removeItem(row.key)
    return { ok: true }
})
