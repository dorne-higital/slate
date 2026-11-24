import { and, desc, eq, ilike } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const q = String(getQuery(event).q ?? '').trim().slice(0, 80)
    const onlyImages = getQuery(event).images === '1'
    const filters = [eq(schema.media.siteId, site.id)]
    if (q) filters.push(ilike(schema.media.filename, `%${q.replace(/[%_]/g, '')}%`))
    if (onlyImages) filters.push(ilike(schema.media.contentType, 'image/%'))
    const rows = await useDb().select().from(schema.media).where(and(...filters)).orderBy(desc(schema.media.createdAt)).limit(500)
    return rows.map(toMediaItem)
})
