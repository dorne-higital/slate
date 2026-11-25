import { eq } from 'drizzle-orm'

/** Everything the admin Billing screen needs about one site. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = getRouterParam(event, 'siteId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const site = await useDb().query.sites.findFirst({ where: eq(schema.sites.id, id) })
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const who = await billableUser(site)
    const billing = await siteBilling(site)
    return {
        site: { id: site.id, name: site.name },
        billTo: who ? { name: who.user.name, email: who.user.email, isPayer: who.isPayer } : null,
        billing,
        invoices: await customInvoicesFor([site.id])
    }
})
