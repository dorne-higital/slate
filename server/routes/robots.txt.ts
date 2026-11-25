/** Points search engines at the sitemap. The CMS itself (Slate's own host) keeps its app pages out. */
export default defineEventHandler(async (event) => {
    setResponseHeaders(event, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' })
    const site = await resolveTenant(event)
    if (!site) {
        const host = useRuntimeConfig().public.appHost
        return `User-agent: *\nDisallow: /sites/\nDisallow: /admin\nDisallow: /api/\n\nSitemap: https://${host}/sitemap.xml\n`
    }
    return `User-agent: *\nDisallow: /api/\n\nSitemap: https://${await liveAddress(site)}/sitemap.xml\n`
})
