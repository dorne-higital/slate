import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const pageId = getRouterParam(event, 'pageId')
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    if (!pageId) {
        throw createError({ statusCode: 400, statusMessage: 'pageId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'editor')

    // Child/grandchild pages cascade via the pages.parent_id FK.
    const { error } = await client
        .from('pages')
        .delete()
        .eq('id', pageId)
        .eq('site_id', siteId)

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { success: true }
})
