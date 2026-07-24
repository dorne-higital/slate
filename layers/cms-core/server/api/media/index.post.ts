import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    const { client, userId } = await requireSiteAccess(event, siteId, 'editor')

    const parts = await readMultipartFormData(event)
    const filePart = parts?.find(part => part.name === 'file' && part.filename)

    if (!filePart?.filename) {
        throw createError({ statusCode: 400, statusMessage: 'A file is required' })
    }

    const safeFilename = filePart.filename.replace(/[^a-zA-Z0-9.\-_]/g, '-')
    const path = `${siteId}/${crypto.randomUUID()}-${safeFilename}`
    const mimeType = filePart.type ?? 'application/octet-stream'

    const { error: uploadError } = await client.storage
        .from('media')
        .upload(path, filePart.data, { contentType: mimeType })

    if (uploadError) {
        throw createError({ statusCode: 400, statusMessage: uploadError.message })
    }

    const { data: media, error: insertError } = await client
        .from('media')
        .insert({
            site_id: siteId,
            path,
            filename: filePart.filename,
            mime_type: mimeType,
            size_bytes: filePart.data.length,
            uploaded_by: userId
        })
        .select()
        .single()

    if (insertError) {
        // Storage upload already succeeded — clean up rather than leave an orphaned object.
        await client.storage.from('media').remove([path])
        throw createError({ statusCode: 400, statusMessage: insertError.message })
    }

    const { data: publicUrl } = client.storage.from('media').getPublicUrl(path)

    return { media: { ...media, url: publicUrl.publicUrl } }
})
