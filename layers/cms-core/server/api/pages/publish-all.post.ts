import { requireSiteAccess } from '../../utils/requireSiteAccess'

interface PublishAllBody {
    siteId: string
}

export default defineEventHandler(async (event) => {
    const body = await readBody<PublishAllBody>(event)

    if (!body?.siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    const { data, error } = await client
        .from('pages')
        .update({ status: 'published' })
        .eq('site_id', body.siteId)
        .eq('status', 'draft')
        .select('id')

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { publishedCount: data.length }
})
