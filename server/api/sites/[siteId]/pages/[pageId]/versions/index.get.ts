import { and, desc, eq } from 'drizzle-orm'

/** A page's published versions, newest first. The newest one is what visitors see now. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const pageId = getRouterParam(event, 'pageId')!
    if (!isUuid(pageId)) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const rows = await useDb()
        .select({ id: schema.pageVersions.id, title: schema.pageVersions.title, blocks: schema.pageVersions.blocks, createdAt: schema.pageVersions.createdAt, by: schema.user.name })
        .from(schema.pageVersions)
        .leftJoin(schema.user, eq(schema.user.id, schema.pageVersions.publishedBy))
        .where(and(eq(schema.pageVersions.pageId, pageId), eq(schema.pageVersions.siteId, site.id)))
        .orderBy(desc(schema.pageVersions.createdAt))
    return rows.map((r, i) => ({
        id: r.id,
        title: r.title,
        createdAt: r.createdAt.toISOString(),
        by: r.by,
        blockCount: r.blocks.length,
        // A short summary so versions can be told apart: the first few block headings
        summary: r.blocks.map(b => String((b.props as Record<string, unknown>).heading ?? '')).filter(Boolean).slice(0, 3).join(' · '),
        live: i === 0
    }))
})
