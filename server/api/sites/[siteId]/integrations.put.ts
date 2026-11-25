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
        await requireWithinPlan(site, l => integrationAllowed(l, info.key), `${info.name} comes with the Business and Studio plans.`)
        const clean = cleanIntegrationValue(info.key, value)
        if (!clean) {
            const f = info.fields ?? []
            throw createError({ statusCode: 400, statusMessage: f.length
                ? `That doesn’t look like a ${info.name} ${f.map(x => x.label.toLowerCase()).join(' and ')}. It should look like ${f.map(x => x.placeholder).join(' and ')}`
                : 'That setting isn’t available.' })
        }
        next[info.key] = clean
    }
    await useDb().update(schema.sites).set({ integrations: next, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    return next
})
