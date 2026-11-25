import { and, eq } from 'drizzle-orm'

/** Rename a file or describe it (alt text for screen readers). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const id = getRouterParam(event, 'mediaId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'File not found' })
    const b = await readBody<{ alt?: string, filename?: string }>(event)
    const set: Partial<typeof schema.media.$inferInsert> = {}
    if (b.alt !== undefined) set.alt = String(b.alt).trim().slice(0, 300) || null
    if (b.filename !== undefined) set.filename = String(b.filename).replace(/[^\w.\- ()]/g, '').slice(0, 120) || undefined
    const [row] = await useDb().update(schema.media).set(set).where(and(eq(schema.media.id, id), eq(schema.media.siteId, site.id))).returning()
    if (!row) throw createError({ statusCode: 404, statusMessage: 'File not found' })
    return toMediaItem(row)
})
