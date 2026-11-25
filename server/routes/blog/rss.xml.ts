/** RSS feed of a client site's live posts, for feed readers and email newsletter tools. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const [posts, address] = await Promise.all([livePosts(site.id, { limit: 30 }), liveAddress(site)])
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const base = `https://${address}`
    setResponseHeaders(event, { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600' })
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(site.name)}</title>
<link>${base}${BLOG_PATH}</link>
<atom:link href="${base}${BLOG_PATH}/rss.xml" rel="self" type="application/rss+xml"/>
<description>${esc(`Latest posts from ${site.name}`)}</description>
${posts.map(p => `<item>
<title>${esc(p.title)}</title>
<link>${base}${BLOG_PATH}/${p.slug}</link>
<guid>${base}${BLOG_PATH}/${p.slug}</guid>
<pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
<description>${esc(p.summary)}</description>
</item>`).join('\n')}
</channel>
</rss>
`
})
