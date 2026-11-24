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
        const host = useRuntimeConfig().public.appHost
        return urlset([`/`, `/signup`].map(p => ({ loc: `https://${host}${p}` })))
    }

    const address = await liveAddress(site)
    const pages = await useDb()
        .select({ path: schema.pages.path, publishedAt: schema.pages.publishedAt })
        .from(schema.pages)
        .where(and(eq(schema.pages.siteId, site.id), eq(schema.pages.status, 'published'), eq(schema.pages.noIndex, false)))
        .orderBy(asc(schema.pages.position))
    return urlset(pages.map(p => ({ loc: `https://${address}${p.path}`, lastmod: p.publishedAt?.toISOString().slice(0, 10) })))
})
