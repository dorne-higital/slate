import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

/**
 * Which client site a request's Host belongs to, or null for Slate's own host.
 *   {slug}.{sitesDomain}  → that site's free address
 *   anything else         → looked up as a custom domain (served via Cloudflare for SaaS)
 */
export async function resolveTenant(event: H3Event) {
    const host = getRequestHost(event, { xForwardedHost: true }) || ''
    const { appHost, sitesDomain } = useRuntimeConfig().public
    if (!host || isAppHost(host, appHost)) return null

    const db = useDb()
    const slug = subdomainSlug(host, sitesDomain)
    if (slug) return (await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) })) ?? null

    const domain = stripPort(host).replace(/^www\./, '')
    return (await db.query.sites.findFirst({ where: eq(schema.sites.customDomain, domain) })) ?? null
}
