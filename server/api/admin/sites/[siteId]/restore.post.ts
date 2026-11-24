import { eq } from 'drizzle-orm'

/** Platform admins: bring back a deleted site (within its 30 days). It comes back offline. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const siteId = getRouterParam(event, 'siteId')!
    if (!isUuid(siteId)) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const [site] = await useDb().update(schema.sites).set({ deletedAt: null, updatedAt: new Date() }).where(eq(schema.sites.id, siteId)).returning({ id: schema.sites.id })
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    return { ok: true }
})
