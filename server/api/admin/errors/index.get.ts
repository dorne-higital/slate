import { desc, eq, gt, sql } from 'drizzle-orm'

/** Server errors in the last 30 days, grouped by kind, newest first. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const db = useDb()
    const day = new Date(Date.now() - 24 * 3600 * 1000)
    const groups = await db.select({
        fingerprint: schema.errorLogs.fingerprint,
        total: sql<number>`count(*)::int`,
        today: sql<number>`count(*) filter (where ${schema.errorLogs.createdAt} > ${day})::int`,
        firstSeen: sql<string>`min(${schema.errorLogs.createdAt})`,
        lastSeen: sql<string>`max(${schema.errorLogs.createdAt})`
    }).from(schema.errorLogs).groupBy(schema.errorLogs.fingerprint).orderBy(desc(sql`max(${schema.errorLogs.createdAt})`)).limit(100)
    // The latest occurrence of each group, for its message, path and stack
    const latest = await Promise.all(groups.map(g => db.select().from(schema.errorLogs).where(eq(schema.errorLogs.fingerprint, g.fingerprint)).orderBy(desc(schema.errorLogs.createdAt)).limit(1).then(r => r[0]!)))
    return groups.map((g, i) => {
        const l = latest[i]!
        return {
            fingerprint: g.fingerprint, total: g.total, today: g.today,
            firstSeen: new Date(g.firstSeen).toISOString(), lastSeen: new Date(g.lastSeen).toISOString(),
            message: l.message, status: l.status, method: l.method, path: l.path, host: l.host, stack: l.stack
        }
    })
})
