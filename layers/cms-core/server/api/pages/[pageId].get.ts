import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const pageId = getRouterParam(event, 'pageId')
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    if (!pageId) {
        throw createError({ statusCode: 400, statusMessage: 'pageId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data, error } = await client
        .from('pages')
        .select('id, site_id, parent_id, title, slug, status, seo_title, seo_description, blocks, created_at, updated_at')
        .eq('id', pageId)
        .eq('site_id', siteId)
        .single()

    if (error) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    return { page: data }
})
