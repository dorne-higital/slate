import { and, eq } from 'drizzle-orm'

/** Deletes a page. The home page can't be deleted, and a page with pages under it needs those moved or deleted first. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const pageId = getRouterParam(event, 'pageId')!
    if (!isUuid(pageId)) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const db = useDb()
    const page = await db.query.pages.findFirst({ where: and(eq(schema.pages.id, pageId), eq(schema.pages.siteId, site.id)) })
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    if (page.path === '/') throw createError({ statusCode: 400, statusMessage: 'The home page can’t be deleted. Change its content instead.' })
    if (page.kind === 'system') throw createError({ statusCode: 400, statusMessage: 'This page is part of every site, so it can’t be deleted. Change its content instead.' })
    const child = await db.query.pages.findFirst({ where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.parentId, page.id)), columns: { id: true } })
    if (child) throw createError({ statusCode: 409, statusMessage: 'This page has pages under it. Delete or move those first.' })
    await db.delete(schema.pages).where(eq(schema.pages.id, page.id))
    return { ok: true }
})
