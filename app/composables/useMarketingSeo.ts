/**
 * Title, description, canonical, share tags and breadcrumbs for a page of Slate's own site,
 * all from the page registry (shared/utils/marketing.ts). Pages add their own structured data via extra.jsonLd.
 */
export const useMarketingSeo = (path: string, extra: { jsonLd?: Record<string, unknown>[], title?: string, description?: string, image?: string } = {}) => {
    const page = marketingPage(path)
    const title = extra.title ?? page.title
    const description = extra.description ?? page.description
    const url = `${MARKETING_SITE}${path}`
    const image = `${MARKETING_SITE}${extra.image ?? page.image}`

    const crumbs: { name: string, url: string }[] = [{ name: 'Slate', url: MARKETING_SITE }]
    if (path !== '/') {
        const parts = path.split('/').filter(Boolean)
        parts.forEach((_, i) => {
            const p = `/${parts.slice(0, i + 1).join('/')}`
            const known = MARKETING_PAGES.find(m => m.path === p)
            if (known) crumbs.push({ name: known.navLabel ?? known.h1, url: `${MARKETING_SITE}${p}` })
            else if (i === parts.length - 1) crumbs.push({ name: title, url })
        })
    }
    const jsonLd = [
        ...(crumbs.length > 1
            ? [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) }]
            : []),
        ...(extra.jsonLd ?? [])
    ]

    useHead({
        title,
        titleTemplate: null,
        link: [{ rel: 'canonical', href: url }],
        script: jsonLd.map(d => ({ type: 'application/ld+json', innerHTML: JSON.stringify(d) }))
    })
    useSeoMeta({
        description,
        ogTitle: title,
        ogDescription: description,
        ogUrl: url,
        ogType: 'website',
        ogSiteName: 'Slate',
        ogLocale: 'en_GB',
        ogImage: image,
        ogImageWidth: 1200,
        ogImageHeight: 630,
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: image
    })
    return page
}
