import { and, eq, ne } from 'drizzle-orm'

/** Project name, address and details (the page content is edited in the page editor). */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const row = await requireProject(site.id, getRouterParam(event, 'projectId')!)
    const b = await readBody<{ title?: string, slug?: string, project?: ProjectMeta }>(event)
    const set: Partial<typeof schema.pages.$inferInsert> = { updatedAt: new Date(), updatedBy: user.id }
    if (b.title !== undefined) {
        const title = String(b.title).trim().slice(0, 120)
        if (!title) throw createError({ statusCode: 400, statusMessage: 'Give the project a name' })
        set.title = title
    }
    if (b.slug !== undefined) {
        const slug = slugify(String(b.slug))
        if (!slug) throw createError({ statusCode: 400, statusMessage: 'The address needs some letters or numbers' })
        const path = `${PROJECTS_PATH}/${slug}`
        const taken = await useDb().query.pages.findFirst({ where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path), ne(schema.pages.id, row.id)), columns: { id: true } })
        if (taken) throw createError({ statusCode: 409, statusMessage: 'Another page already uses that address' })
        set.path = path
    }
    if (b.project !== undefined) set.project = cleanProjectMeta(b.project)
    const [updated] = await useDb().update(schema.pages).set(set).where(eq(schema.pages.id, row.id)).returning()
    return toEditorProject(updated!)
})
