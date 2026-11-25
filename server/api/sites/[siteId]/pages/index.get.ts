import { and, asc, eq, inArray } from 'drizzle-orm'

/** The site's pages. With ?projects=1 (the Pages screen), projects are included too, under the /work page. */
export default defineEventHandler(async (event): Promise<PageListItem[]> => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const db = useDb()
    const withProjects = getQuery(event).projects === '1'

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
            updatedByName: schema.user.name,
            kind: schema.pages.kind
        })
        .from(schema.pages)
        .leftJoin(schema.user, eq(schema.user.id, schema.pages.updatedBy))
        .where(and(eq(schema.pages.siteId, site.id), inArray(schema.pages.kind, withProjects ? ['page', 'project'] : ['page'])))
        .orderBy(asc(schema.pages.position), asc(schema.pages.path))

    // Projects hang off the Work page (or whichever page sits at /work)
    const work = rows.find(r => r.kind === 'page' && r.path === '/work')?.id ?? null
    return rows.map(r => ({
        id: r.id,
        parentId: r.kind === 'project' ? (r.parentId ?? work) : r.parentId,
        kind: r.kind as 'page' | 'project',
        title: r.title,
        path: r.path,
        status: r.status,
        hasUnpublishedChanges: r.status === 'published' && JSON.stringify(r.blocks) !== JSON.stringify(r.publishedBlocks),
        updatedAt: r.updatedAt.toISOString(),
        updatedByName: r.updatedByName
    }))
})
