import { and, asc, eq, isNull, lte } from 'drizzle-orm'

/**
 * A site's three menus. A header menu nobody has set up yet falls back to the
 * published top-level pages, so a brand-new site still has working navigation.
 */
export async function loadMenus(siteId: string): Promise<Record<MenuSlot, MenuItem[]> & { headerIsAuto: boolean }> {
    const db = useDb()
    const rows = await db.select().from(schema.menus).where(eq(schema.menus.siteId, siteId))
    const bySlot = Object.fromEntries(rows.map(r => [r.slot, r.items])) as Partial<Record<MenuSlot, MenuItem[]>>

    let header = bySlot.header
    const headerIsAuto = header === undefined
    if (!header) {
        const pages = await db
            .select({ id: schema.pages.id, title: schema.pages.title, path: schema.pages.path })
            .from(schema.pages)
            .where(and(eq(schema.pages.siteId, siteId), eq(schema.pages.status, 'published'), isNull(schema.pages.parentId), eq(schema.pages.kind, 'page')))
            .orderBy(asc(schema.pages.position))
        header = pages.filter(p => p.path !== '/').map(p => ({ id: p.id, label: p.title, url: p.path, depth: 0 as const }))
        // Sites with a blog get a Blog link until they set their own header menu
        const hasPosts = await db.query.posts.findFirst({
            where: and(eq(schema.posts.siteId, siteId), eq(schema.posts.status, 'published'), lte(schema.posts.publishedAt, new Date())),
            columns: { id: true }
        })
        if (hasPosts) header.push({ id: 'blog', label: 'Blog', url: BLOG_PATH, depth: 0 })
    }
    return { header, footer: bySlot.footer ?? [], legal: bySlot.legal ?? [], headerIsAuto }
}
