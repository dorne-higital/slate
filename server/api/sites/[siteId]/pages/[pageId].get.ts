import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const pageId = getRouterParam(event, 'pageId')!
    if (!isUuid(pageId)) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    const page = await useDb().query.pages.findFirst({
        where: and(eq(schema.pages.id, pageId), eq(schema.pages.siteId, site.id))
    })
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    return toEditorPage(page)
})
