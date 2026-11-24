import { and, inArray, isNotNull, lt } from 'drizzle-orm'


/**
 * Daily: permanently remove sites deleted more than 30 days ago, their client domains in
 * Cloudflare for SaaS, and invitation links that expired more than 30 days ago.
 * Runs from the Worker's cron trigger (wrangler.jsonc) via Nitro's scheduledTasks.
 */
export default defineTask({
    meta: { name: 'purge:deleted-sites', description: 'Purge sites deleted over 30 days ago' },
    async run() {
        const db = useDb()
        const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000)
        const doomed = await db.select({ id: schema.sites.id }).from(schema.sites)
            .where(and(isNotNull(schema.sites.deletedAt), lt(schema.sites.deletedAt, cutoff)))
        const ids = doomed.map(s => s.id)

        let hostnames = 0
        if (ids.length) {
            const domains = await db.select({ cloudflareId: schema.domains.cloudflareId }).from(schema.domains).where(inArray(schema.domains.siteId, ids))
            for (const d of domains) {
                if (!d.cloudflareId) continue
                try {
                    await deleteCustomHostname(d.cloudflareId)
                    hostnames++
                } catch {
                    // Leave it for tomorrow's run rather than failing the whole purge
                }
            }
            // Everything else (pages, forms, replies, posts, members, menus, domains) cascades
            await db.delete(schema.sites).where(inArray(schema.sites.id, ids))
        }
        // Error log entries older than 30 days
        await db.delete(schema.errorLogs).where(lt(schema.errorLogs.createdAt, cutoff))

        const oldInvites = await db.delete(schema.invites).where(lt(schema.invites.expiresAt, cutoff)).returning({ id: schema.invites.id })
        const summary = { sitesPurged: ids.length, hostnamesRemoved: hostnames, invitesRemoved: oldInvites.length }
        console.log('[purge]', JSON.stringify(summary))
        return { result: summary }
    }
})

