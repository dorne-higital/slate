/** The site's IndexNow key (or Slate's own, on Slate's host), so search engines can check our pings are really ours. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    setResponseHeaders(event, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400' })
    // Slate's own host has its own key, for pings about the marketing site and guides
    return indexNowKey(site ? site.id : 'marketing')
})
