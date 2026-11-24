import { and, eq } from 'drizzle-orm'

/** Removes a category. Its posts stay, without a category. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const id = getRouterParam(event, 'categoryId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Category not found' })
    await useDb().delete(schema.postCategories).where(and(eq(schema.postCategories.id, id), eq(schema.postCategories.siteId, site.id)))
    return { ok: true }
})
