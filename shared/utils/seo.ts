/** Google shows roughly this many characters before cutting off. */
export const SEO_TITLE_MAX = 60
export const SEO_DESCRIPTION_MAX = 160

/** The <title> a page gets: its own search title, or its page title, plus the site's ending. */
export function fullTitle(page: { title: string, seoTitle?: string | null, path?: string }, siteName: string, seo?: SiteSeo | null) {
    const suffix = seo?.titleSuffix?.trim() || siteName
    // The home page is the business itself, not a page called "Home"
    if (page.path === '/' && !page.seoTitle?.trim()) return suffix
    const base = page.seoTitle?.trim() || page.title
    // A custom search title that already names the business doesn't need the ending again
    return page.seoTitle?.trim() && base.toLowerCase().includes(siteName.toLowerCase()) ? base : `${base} | ${suffix}`
}

export function cleanSiteSeo(input: unknown): SiteSeo {
    const r = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const out: SiteSeo = {}
    const suffix = str(r.titleSuffix, 80)
    const desc = str(r.defaultDescription, 320)
    const image = safeUrl(str(r.defaultShareImage, 1000))
    if (suffix) out.titleSuffix = suffix
    if (desc) out.defaultDescription = desc
    if (image) out.defaultShareImage = image
    return out
}
