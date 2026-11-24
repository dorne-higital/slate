import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const theme = cleanTheme(await readBody(event))
    await useDb().update(schema.sites).set({ theme, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return theme
})
