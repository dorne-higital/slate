/** Title, description, canonical and share tags for a public client-site page. */
export function useSiteSeo(input: () => null | undefined | {
    title: string
    shortTitle: string
    description?: string | null
    image?: string | null
    url: string
    siteName: string
    noIndex?: boolean
    type?: 'website' | 'article'
}) {
    const seo = computed(input)
    useSeoMeta({
        title: () => seo.value?.title ?? '',
        description: () => seo.value?.description || undefined,
        ogTitle: () => seo.value?.shortTitle,
        ogDescription: () => seo.value?.description || undefined,
        // Media library images are stored as /media/…; share previews need the full address
        ogImage: () => {
            const img = seo.value?.image
            if (!img) return undefined
            return img.startsWith('/') && !img.startsWith('//') ? new URL(img, seo.value!.url).href : img
        },
        ogUrl: () => seo.value?.url,
        ogSiteName: () => seo.value?.siteName,
        ogType: () => seo.value?.type ?? 'website',
        twitterCard: () => (seo.value?.image ? 'summary_large_image' : 'summary'),
        robots: () => (seo.value?.noIndex ? 'noindex' : undefined)
    })
    useHead(() => ({ link: seo.value ? [{ rel: 'canonical', href: seo.value.url }] : [] }))
}
