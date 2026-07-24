import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data, error } = await client
        .from('pages')
        .select('id, site_id, parent_id, title, slug, status, seo_title, seo_description, blocks, created_at, updated_at')
        .eq('site_id', siteId)
        .order('title', { ascending: true })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { pages: data }
})
