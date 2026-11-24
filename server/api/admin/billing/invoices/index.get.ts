/** Every custom invoice, newest first, with the site name. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const invoices = await customInvoicesFor()
    const sites = await useDb().select({ id: schema.sites.id, name: schema.sites.name }).from(schema.sites)
    const name = new Map(sites.map(s => [s.id, s.name]))
    return invoices.map(i => ({ ...i, siteName: i.siteId ? name.get(i.siteId) ?? null : null }))
})
