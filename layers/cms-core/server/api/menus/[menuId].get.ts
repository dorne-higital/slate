import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const menuId = getRouterParam(event, 'menuId')
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    if (!menuId) {
        throw createError({ statusCode: 400, statusMessage: 'menuId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data, error } = await client
        .from('menus')
        .select('id, site_id, name, slug, slot, items, created_at, updated_at')
        .eq('id', menuId)
        .eq('site_id', siteId)
        .single()

    if (error) {
        throw createError({ statusCode: 404, statusMessage: 'Menu not found' })
    }

    return { menu: data }
})
