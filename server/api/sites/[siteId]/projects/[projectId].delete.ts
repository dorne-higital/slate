import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const row = await requireProject(site.id, getRouterParam(event, 'projectId')!)
    await useDb().delete(schema.pages).where(eq(schema.pages.id, row.id))
    return { ok: true }
})
