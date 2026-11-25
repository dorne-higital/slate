import { and, eq, gt } from 'drizzle-orm'

/**
 * Every 10 minutes: re-check domains still waiting on Cloudflare (added in the last 14 days), so they go
 * live without anyone keeping the Domains page open. For domains Slate registered, this also adds
 * Cloudflare's TXT ownership record at name.com (see refreshDomain).
 */
export default defineTask({
    meta: { name: 'domains:check-pending', description: 'Re-check domains waiting for DNS or HTTPS' },
    async run() {
        const since = new Date(Date.now() - 14 * 24 * 3600 * 1000)
        const rows = await useDb().select().from(schema.domains).where(and(eq(schema.domains.status, 'pending'), gt(schema.domains.createdAt, since))).limit(50)
        let live = 0
        for (const row of rows) {
            if (await refreshDomain(row).catch(() => 'pending') === 'active') live++
        }
        return { result: { checked: rows.length, live } }
    }
})
