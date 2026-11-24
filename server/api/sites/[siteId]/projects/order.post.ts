import { and, eq, inArray } from 'drizzle-orm'

/** Saves the order projects appear in (on Projects blocks). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const { ids } = await readBody<{ ids?: string[] }>(event)
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every(isUuid)) throw createError({ statusCode: 400, statusMessage: 'Send the projects in their new order' })
    const db = useDb()
    const owned = await db.select({ id: schema.pages.id }).from(schema.pages).where(and(eq(schema.pages.siteId, site.id), eq(schema.pages.kind, 'project'), inArray(schema.pages.id, ids)))
    if (owned.length !== ids.length) throw createError({ statusCode: 409, statusMessage: 'The projects changed while you were moving them. Refresh and try again.' })
    const updates = ids.map((id, position) => db.update(schema.pages).set({ position: 10000 + position }).where(and(eq(schema.pages.id, id), eq(schema.pages.siteId, site.id))))
    await db.batch(updates as [typeof updates[number], ...typeof updates])
    return { ok: true }
})
