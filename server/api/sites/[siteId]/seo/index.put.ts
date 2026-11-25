import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const seo = cleanSiteSeo(await readBody(event))
    await useDb().update(schema.sites).set({ seo, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return seo
})
