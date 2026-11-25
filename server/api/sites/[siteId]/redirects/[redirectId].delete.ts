import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const id = getRouterParam(event, 'redirectId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Redirect not found' })
    const [gone] = await useDb().delete(schema.redirects).where(and(eq(schema.redirects.id, id), eq(schema.redirects.siteId, site.id))).returning({ id: schema.redirects.id })
    if (!gone) throw createError({ statusCode: 404, statusMessage: 'Redirect not found' })
    return { ok: true }
})
