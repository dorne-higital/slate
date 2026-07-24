import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data, error } = await client
        .from('media')
        .select('id, site_id, path, filename, mime_type, size_bytes, uploaded_by, created_at')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    const media = (data ?? []).map((item) => {
        const { data: publicUrl } = client.storage.from('media').getPublicUrl(item.path)
        return { ...item, url: publicUrl.publicUrl }
    })

    return { media }
})
