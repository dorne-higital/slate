import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    return await listTickets(eq(schema.supportTickets.siteId, site.id))
})
