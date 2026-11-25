/** Upload one file (multipart field "file"; optional "width", "height" measured by the browser). */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const length = Number(getRequestHeader(event, 'content-length') ?? 0)
    if (length > MAX_UPLOAD_BYTES + 64 * 1024) throw createError({ statusCode: 413, statusMessage: 'That file is too big. The limit is 10 MB.' })

    const parts = await readMultipartFormData(event)
    const file = parts?.find(p => p.name === 'file' && p.data?.length)
    if (!file) throw createError({ statusCode: 400, statusMessage: 'Choose a file to upload' })
    if (file.data.length > MAX_UPLOAD_BYTES) throw createError({ statusCode: 413, statusMessage: 'That file is too big. The limit is 10 MB.' })

    const { limits } = await payerLimits(site)
    if (await storageUsed(site) + file.data.length > limits.storageBytes) {
        throw createError({ statusCode: 402, statusMessage: `You’ve used all ${formatGB(limits.storageBytes)} of your storage. Delete some files, or change plan in Billing for more.` })
    }
    const kind = sniffType(file.data)
    if (!kind) throw createError({ statusCode: 415, statusMessage: 'Slate takes JPG, PNG, WebP, GIF, AVIF and PDF files.' })

    const num = (name: string) => {
        const v = Number.parseInt(parts!.find(p => p.name === name)?.data.toString() ?? '')
        return Number.isFinite(v) && v > 0 && v < 100000 ? v : null
    }
    const id = crypto.randomUUID()
    const key = `${site.id}/${id}.${kind.ext}`
    const filename = (file.filename ?? `upload.${kind.ext}`).replace(/[^\w.\- ()]/g, '').slice(0, 120) || `upload.${kind.ext}`

    await useMediaStorage().setItemRaw(key, file.data)
    const [row] = await useDb().insert(schema.media).values({
        id, siteId: site.id, key, filename, contentType: kind.type, size: file.data.length,
        width: kind.type.startsWith('image/') ? num('width') : null,
        height: kind.type.startsWith('image/') ? num('height') : null,
        uploadedBy: user.id
    }).returning()
    return toMediaItem(row!)
})
