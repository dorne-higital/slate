import { eq } from 'drizzle-orm'

/**
 * Serves an uploaded file on any Slate host (CMS or client site). Keys are "{siteId}/{uuid}.{ext}",
 * unguessable and never reused, so responses can be cached forever.
 */
export default defineEventHandler(async (event) => {
    const key = getRouterParam(event, 'key') ?? ''
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|gif|webp|avif|pdf)$/.test(key)) {
        throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
    const row = await useDb().query.media.findFirst({ where: eq(schema.media.key, key) })
    if (!row) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const data = await useMediaStorage().getItemRaw<Uint8Array | ArrayBuffer>(key)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Not found' })

    setResponseHeaders(event, {
        'content-type': row.contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        'x-content-type-options': 'nosniff',
        // PDFs open in the browser but can't run anything on our domain
        'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
        'content-disposition': `inline; filename="${row.filename.replace(/"/g, '')}"`
    })
    return data instanceof Uint8Array ? data : new Uint8Array(data)
})
