import { and, eq } from 'drizzle-orm'

/** Saves the order of the site's pages (also the order of the automatic header menu). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const { ids } = await readBody<{ ids?: string[] }>(event)
    if (!Array.isArray(ids) || !ids.length || ids.length > 1000 || !ids.every(isUuid) || new Set(ids).size !== ids.length) {
        throw createError({ statusCode: 400, statusMessage: 'Send every page in its new order' })
    }
    const db = useDb()
    const owned = await db.select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.siteId, site.id))
    if (owned.length !== ids.length || !owned.every(p => ids.includes(p.id))) {
        throw createError({ statusCode: 409, statusMessage: 'The pages changed while you were moving them. Refresh and try again.' })
    }
    const updates = ids.map((id, position) => db.update(schema.pages).set({ position }).where(and(eq(schema.pages.id, id), eq(schema.pages.siteId, site.id))))
    await db.batch(updates as [typeof updates[number], ...typeof updates])
    return { ok: true }
})
