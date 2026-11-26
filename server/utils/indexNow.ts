/**
 * IndexNow: tells Bing, Yandex and others about a newly published URL straight away.
 * Each site has its own key, derived from the auth secret, served at /indexnow-key.txt on the site.
 */
export async function indexNowKey(siteId: string) {
    const secret = useRuntimeConfig().betterAuthSecret || 'dev'
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`indexnow:${siteId}`)))
    return [...sig.slice(0, 16)].map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Pings IndexNow for some paths on a site. Quietly does nothing for offline sites or local development. */
export async function pingIndexNow(site: typeof schema.sites.$inferSelect, paths: string[]) {
    if (site.offline || !paths.length) return
    const host = await liveAddress(site)
    if (/localhost|127\.0\.0\.1/.test(host)) return
    const key = await indexNowKey(site.id)
    await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host, key, keyLocation: `https://${host}/indexnow-key.txt`, urlList: paths.map(p => `https://${host}${p}`) }),
        signal: AbortSignal.timeout(8000)
    }).catch(() => {})
}

/**
 * Pings IndexNow for pages of Slate's own site (slatecms.co.uk), such as a newly published guide.
 * Does nothing before launch or when running locally.
 */
export async function pingMarketing(paths: string[]) {
    const { appHost, comingSoon } = useRuntimeConfig().public
    if (comingSoon || !paths.length || /localhost|127\.0\.0\.1/.test(appHost)) return
    const key = await indexNowKey('marketing')
    await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ host: appHost, key, keyLocation: `https://${appHost}/indexnow-key.txt`, urlList: paths.map(p => `https://${appHost}${p}`) }),
        signal: AbortSignal.timeout(8000)
    }).catch(() => {})
}
