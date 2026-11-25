import type { H3Event } from 'h3'
import { and, eq, sql } from 'drizzle-orm'

/** The redirect for an address on a site, if there is one. Counts the hit in the background. */
export async function findRedirect(event: H3Event, siteId: string, path: string) {
    const key = redirectKey(path)
    if (key === '/') return null
    const row = await useDb().query.redirects.findFirst({ where: and(eq(schema.redirects.siteId, siteId), eq(schema.redirects.fromPath, key)) })
    if (!row) return null
    event.waitUntil?.(useDb().update(schema.redirects).set({ hits: sql`${schema.redirects.hits} + 1`, lastHitAt: new Date() }).where(eq(schema.redirects.id, row.id)).then(() => {}, () => {}))
    return { to: row.toUrl, permanent: row.permanent }
}

export function toRedirectItem(r: typeof schema.redirects.$inferSelect) {
    return { id: r.id, from: r.fromPath, to: r.toUrl, permanent: r.permanent, hits: r.hits, lastHitAt: r.lastHitAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }
}
