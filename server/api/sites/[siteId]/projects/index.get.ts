import { and, asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb().select().from(schema.pages)
        .where(and(eq(schema.pages.siteId, site.id), eq(schema.pages.kind, 'project')))
        .orderBy(asc(schema.pages.position), asc(schema.pages.createdAt))
    return rows.map(toEditorProject)
})
