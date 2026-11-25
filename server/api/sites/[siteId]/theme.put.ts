import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    // Theme and Layout each send only their own settings, so merge with what's saved
    const theme = resolveThemeFonts(cleanTheme({ ...(site.theme ?? {}), ...(await readBody<Record<string, unknown>>(event)) }))
    await useDb().update(schema.sites).set({ theme, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return theme
})
