import { and, asc, eq } from 'drizzle-orm'

/** A client site's published pages for search engines. On Slate's own host: the marketing pages. */
export default defineEventHandler(async (event) => {
    setResponseHeaders(event, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' })
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const urlset = (urls: { loc: string, lastmod?: string }[]) =>
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
            urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')
        }\n</urlset>\n`

    const site = await resolveTenant(event)
    if (!site) {
        // Slate's own site: just the home page until launch, then every marketing page and live guide
        const { appHost, comingSoon } = useRuntimeConfig().public
        const base = `https://${appHost}`
        if (comingSoon) return urlset([{ loc: `${base}/` }])
        const guidesSite = await marketingSite()
        const guides = guidesSite ? await livePosts(guidesSite.id, { limit: 500 }) : []
        return urlset([
            // No lastmod for coded pages: we can't know honestly when each last changed
            ...MARKETING_PAGES.map(p => ({ loc: `${base}${p.path}` })),
            ...guides.map(g => ({ loc: `${base}/guides/${g.slug}`, lastmod: g.publishedAt.slice(0, 10) })),
            ...helpArticles().map(a => ({ loc: `${base}/help/${a.slug}` }))
        ])
    }

    const address = await liveAddress(site)
    const pages = await useDb()
        .select({ path: schema.pages.path, publishedAt: schema.pages.publishedAt })
        .from(schema.pages)
        .where(and(eq(schema.pages.siteId, site.id), eq(schema.pages.status, 'published'), eq(schema.pages.noIndex, false)))
        .orderBy(asc(schema.pages.position))
    return urlset(pages.map(p => ({ loc: `https://${address}${p.path}`, lastmod: p.publishedAt?.toISOString().slice(0, 10) })))
})
