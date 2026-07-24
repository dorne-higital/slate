import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const mediaId = getRouterParam(event, 'mediaId')
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    if (!mediaId) {
        throw createError({ statusCode: 400, statusMessage: 'mediaId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'editor')

    const { data: existing, error: fetchError } = await client
        .from('media')
        .select('path')
        .eq('id', mediaId)
        .eq('site_id', siteId)
        .single()

    if (fetchError) {
        throw createError({ statusCode: 404, statusMessage: 'Media not found' })
    }

    const { error: deleteRowError } = await client
        .from('media')
        .delete()
        .eq('id', mediaId)
        .eq('site_id', siteId)

    if (deleteRowError) {
        throw createError({ statusCode: 400, statusMessage: deleteRowError.message })
    }

    await client.storage.from('media').remove([existing.path])

    return { success: true }
})
