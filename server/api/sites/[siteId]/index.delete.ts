import { eq } from 'drizzle-orm'

/**
 * Deletes a site (owners only). It disappears at once for everyone; the data is kept for
 * 30 days so a platform admin can restore it, then purged. Typing the site's name confirms it.
 */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'owner')
    const { confirm } = await readBody<{ confirm?: string }>(event)
    if (String(confirm ?? '').trim().toLowerCase() !== site.name.trim().toLowerCase()) {
        throw createError({ statusCode: 400, statusMessage: 'Type the site’s name exactly to confirm' })
    }
    await useDb().update(schema.sites).set({ deletedAt: new Date(), offline: true, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    if (site.billingUserId) await syncExtraSites(site.billingUserId).catch(err => console.error('[billing] extra sites sync failed', err))
    return { ok: true }
})
