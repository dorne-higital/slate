import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<PageListItem[]> => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const db = useDb()

    const rows = await db
        .select({
            id: schema.pages.id,
            parentId: schema.pages.parentId,
            title: schema.pages.title,
            path: schema.pages.path,
            status: schema.pages.status,
            updatedAt: schema.pages.updatedAt,
            blocks: schema.pages.blocks,
            publishedBlocks: schema.pages.publishedBlocks,
            updatedByName: schema.user.name
        })
        .from(schema.pages)
        .leftJoin(schema.user, eq(schema.user.id, schema.pages.updatedBy))
        .where(eq(schema.pages.siteId, site.id))
        .orderBy(asc(schema.pages.position), asc(schema.pages.path))

    return rows.map(r => ({
        id: r.id,
        parentId: r.parentId,
        title: r.title,
        path: r.path,
        status: r.status,
        hasUnpublishedChanges: r.status === 'published' && JSON.stringify(r.blocks) !== JSON.stringify(r.publishedBlocks),
        updatedAt: r.updatedAt.toISOString(),
        updatedByName: r.updatedByName
    }))
})
