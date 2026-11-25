import { and, eq, inArray, max } from 'drizzle-orm'

/** Makes sure the site has each system page (404…), creating any that are missing, published, with sensible content. */
export async function ensureSystemPages(siteId: string) {
    const db = useDb()
    const have = await db.select({ path: schema.pages.path }).from(schema.pages)
        .where(and(eq(schema.pages.siteId, siteId), inArray(schema.pages.path, SYSTEM_PAGES.map(p => p.path))))
    const missing = SYSTEM_PAGES.filter(p => !have.some(h => h.path === p.path))
    if (!missing.length) return
    const [{ last } = { last: 0 }] = await db.select({ last: max(schema.pages.position) }).from(schema.pages).where(eq(schema.pages.siteId, siteId))
    const now = new Date()
    await db.insert(schema.pages).values(missing.map((p, i) => {
        const blocks = p.blocks()
        return { siteId, kind: 'system' as const, path: p.path, title: p.title, position: (last ?? 0) + 100 + i, status: 'published' as const, blocks, publishedBlocks: blocks, publishedAt: now, noIndex: true }
    })).onConflictDoNothing()
}
