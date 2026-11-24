import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'

/**
 * Which client site a request's Host belongs to, or null for Slate's own host.
 *   {slug}.{sitesDomain}  → that site's free address
 *   anything else         → a connected custom domain (served via Cloudflare for SaaS)
 * Cached on the event, since a page render asks more than once.
 */
export async function resolveTenant(event: H3Event) {
    if (event.context.tenant !== undefined) return event.context.tenant as typeof schema.sites.$inferSelect | null

    const host = getRequestHost(event, { xForwardedHost: true }) || ''
    const { appHost, sitesDomain } = useRuntimeConfig().public
    let site: typeof schema.sites.$inferSelect | null = null

    if (host && !isAppHost(host, appHost)) {
        const db = useDb()
        const slug = subdomainSlug(host, sitesDomain)
        if (slug) {
            site = (await db.query.sites.findFirst({ where: eq(schema.sites.slug, slug) })) ?? null
        } else {
            const domain = await db.query.domains.findFirst({ where: eq(schema.domains.hostname, stripPort(host)) })
            if (domain) site = (await db.query.sites.findFirst({ where: eq(schema.sites.id, domain.siteId) })) ?? null
        }
    }
    event.context.tenant = site
    return site
}
