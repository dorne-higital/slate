import { and, asc, eq } from 'drizzle-orm'

/** Published projects as cards, in the order set in the CMS. */
export async function liveProjectCards(siteId: string): Promise<ProjectCard[]> {
    const rows = await useDb().select({ title: schema.pages.title, path: schema.pages.path, project: schema.pages.project })
        .from(schema.pages)
        .where(and(eq(schema.pages.siteId, siteId), eq(schema.pages.kind, 'project'), eq(schema.pages.status, 'published')))
        .orderBy(asc(schema.pages.position), asc(schema.pages.createdAt))
    return rows.map(r => toProjectCard(r.title, r.path, r.project))
}

export function toProjectCard(title: string, path: string, p: ProjectMeta | null): ProjectCard {
    return { title, path, category: p?.category ?? '', summary: p?.summary ?? '', cover: p?.cover ?? '', coverAlt: p?.coverAlt ?? '', year: p?.year ?? '', featured: !!p?.featured }
}

export async function requireProject(siteId: string, id: string) {
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
    const row = await useDb().query.pages.findFirst({ where: and(eq(schema.pages.id, id), eq(schema.pages.siteId, siteId), eq(schema.pages.kind, 'project')) })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Project not found' })
    return row
}

export function toEditorProject(r: typeof schema.pages.$inferSelect) {
    return {
        id: r.id,
        title: r.title,
        slug: r.path.slice(PROJECTS_PATH.length + 1),
        path: r.path,
        status: r.status,
        hasUnpublishedChanges: r.status === 'published' && JSON.stringify(r.blocks) !== JSON.stringify(r.publishedBlocks),
        project: { ...cleanProjectMeta({}), ...(r.project ?? {}) },
        updatedAt: r.updatedAt.toISOString()
    }
}
