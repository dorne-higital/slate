import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const menuId = getRouterParam(event, 'menuId')
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    if (!menuId) {
        throw createError({ statusCode: 400, statusMessage: 'menuId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'editor')

    const { error } = await client
        .from('menus')
        .delete()
        .eq('id', menuId)
        .eq('site_id', siteId)

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { success: true }
})
