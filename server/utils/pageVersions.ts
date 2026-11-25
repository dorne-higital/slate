import { and, desc, eq, inArray } from 'drizzle-orm'

export const KEEP_VERSIONS = 30

/** Saves what was just published, then trims the page's history to the newest 30. Skips it if nothing changed since the last version. */
export async function savePageVersion(page: typeof schema.pages.$inferSelect, userId: string) {
    const db = useDb()
    const blocks = page.publishedBlocks ?? []
    const [last] = await db.select({ blocks: schema.pageVersions.blocks }).from(schema.pageVersions)
        .where(eq(schema.pageVersions.pageId, page.id)).orderBy(desc(schema.pageVersions.createdAt)).limit(1)
    if (last && JSON.stringify(last.blocks) === JSON.stringify(blocks)) return
    await db.insert(schema.pageVersions).values({ pageId: page.id, siteId: page.siteId, title: page.title, blocks, publishedBy: userId })
    const old = await db.select({ id: schema.pageVersions.id }).from(schema.pageVersions)
        .where(eq(schema.pageVersions.pageId, page.id)).orderBy(desc(schema.pageVersions.createdAt)).offset(KEEP_VERSIONS)
    if (old.length) await db.delete(schema.pageVersions).where(and(eq(schema.pageVersions.pageId, page.id), inArray(schema.pageVersions.id, old.map(o => o.id))))
}
