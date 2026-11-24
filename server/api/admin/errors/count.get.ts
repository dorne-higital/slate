import { gt, sql } from 'drizzle-orm'

/** Kinds of error seen in the last 24 hours, for the admin bar badge. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const [{ n } = { n: 0 }] = await useDb().select({ n: sql<number>`count(distinct ${schema.errorLogs.fingerprint})::int` }).from(schema.errorLogs)
        .where(gt(schema.errorLogs.createdAt, new Date(Date.now() - 24 * 3600 * 1000)))
    return { n }
})
