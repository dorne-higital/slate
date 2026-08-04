import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data, error } = await client
        .from('menus')
        .select('id, site_id, name, slug, slot, items, created_at, updated_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: true })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { menus: data }
})
