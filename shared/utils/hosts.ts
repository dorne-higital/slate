export function stripPort(host: string): string {
    return host.toLowerCase().replace(/:\d+$/, '')
}

/** True when a request is for Slate itself (marketing site + CMS) rather than a client's site. */
export function isAppHost(host: string, appHost: string): boolean {
    const h = stripPort(host)
    const app = stripPort(appHost)
    return h === app || h === `www.${app}` || h === 'localhost' || h === '127.0.0.1'
}

/** "bramble.slatecms.co.uk" → "bramble" when sitesDomain is slatecms.co.uk; otherwise null. */
export function subdomainSlug(host: string, sitesDomain: string): string | null {
    const h = stripPort(host)
    const suffix = `.${stripPort(sitesDomain)}`
    if (!h.endsWith(suffix)) return null
    const slug = h.slice(0, -suffix.length)
    return slug && !slug.includes('.') ? slug : null
}
