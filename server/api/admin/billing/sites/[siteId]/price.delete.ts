import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const site = await useDb().query.sites.findFirst({ where: eq(schema.sites.id, String(getRouterParam(event, 'siteId'))) })
    if (!site?.billingUserId) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    await clearSpecialPrice(site.billingUserId)
    return { ok: true }
})
