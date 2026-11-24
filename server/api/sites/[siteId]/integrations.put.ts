import { eq } from 'drizzle-orm'

/** Connect, change or disconnect one integration. An empty value disconnects it. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { key, value } = await readBody<{ key?: keyof SiteIntegrations, value?: string }>(event)
    const info = INTEGRATIONS.find(i => i.key === key)
    if (!info) throw createError({ statusCode: 400, statusMessage: 'Unknown integration' })

    const next: SiteIntegrations = { ...(site.integrations ?? {}) }
    if (!value || !String(value).trim()) {
        delete next[info.key]
    } else {
        const clean = cleanIntegrationValue(info.key, value)
        if (!clean) throw createError({ statusCode: 400, statusMessage: `That doesn’t look like a ${info.name} ${info.label.toLowerCase()}. It should look like ${info.placeholder}` })
        next[info.key] = clean
    }
    await useDb().update(schema.sites).set({ integrations: next, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return next
})
