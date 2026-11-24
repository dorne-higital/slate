/**
 * What can be uploaded, identified by the file's first bytes, never by its name or the browser's word.
 * SVG and HTML are refused: they can carry scripts, and files are served from our own domains.
 */
const TYPES: { type: string, ext: string, test: (b: Uint8Array) => boolean }[] = [
    { type: 'image/jpeg', ext: 'jpg', test: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
    { type: 'image/png', ext: 'png', test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47 },
    { type: 'image/gif', ext: 'gif', test: b => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38 },
    { type: 'image/webp', ext: 'webp', test: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 },
    { type: 'image/avif', ext: 'avif', test: b => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66 },
    { type: 'application/pdf', ext: 'pdf', test: b => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 }
]

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export function sniffType(data: Uint8Array) {
    return TYPES.find(t => t.test(data)) ?? null
}

export function mediaUrl(key: string) {
    return `/media/${key}`
}

export function toMediaItem(m: typeof schema.media.$inferSelect) {
    return {
        id: m.id,
        url: mediaUrl(m.key),
        filename: m.filename,
        contentType: m.contentType,
        size: m.size,
        width: m.width,
        height: m.height,
        alt: m.alt ?? '',
        createdAt: m.createdAt.toISOString()
    }
}

export function useMediaStorage() {
    return useStorage('media')
}
