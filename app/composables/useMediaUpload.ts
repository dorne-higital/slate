export interface MediaItem {
    id: string
    url: string
    filename: string
    contentType: string
    size: number
    width: number | null
    height: number | null
    alt: string
    createdAt: string
}

/** Measures an image in the browser so the library can show its size. */
function measure(file: File): Promise<{ width: number, height: number } | null> {
    if (!file.type.startsWith('image/')) return Promise.resolve(null)
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            resolve({ width: img.naturalWidth, height: img.naturalHeight })
            URL.revokeObjectURL(url)
        }
        img.onerror = () => {
            resolve(null)
            URL.revokeObjectURL(url)
        }
        img.src = url
    })
}

export function useMediaUpload(siteId: string) {
    const uploading = ref(0)
    const error = ref('')

    async function upload(files: FileList | File[]): Promise<MediaItem[]> {
        error.value = ''
        const done: MediaItem[] = []
        for (const file of Array.from(files)) {
            if (file.size > 10 * 1024 * 1024) {
                error.value = `${file.name} is too big. The limit is 10 MB.`
                continue
            }
            uploading.value++
            try {
                const body = new FormData()
                body.append('file', file)
                const size = await measure(file)
                if (size) {
                    body.append('width', String(size.width))
                    body.append('height', String(size.height))
                }
                done.push(await $fetch<MediaItem>(`/api/sites/${siteId}/media`, { method: 'POST', body }))
            } catch (err) {
                error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? `Couldn’t upload ${file.name}. Please try again.`
            } finally {
                uploading.value--
            }
        }
        return done
    }

    return { upload, uploading, error }
}

export const formatBytes = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.round(n / 1024))} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
