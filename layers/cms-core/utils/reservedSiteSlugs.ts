/**
 * Subdomains resolve-tenant-domain.ts treats specially (`admin`) or that
 * collide with real path-based routes (`login`, `preview`, `api`, `app`,
 * `www`) — a site created with one of these slugs would be permanently
 * unreachable at its own {slug}.{baseDomain} subdomain, shadowed by the
 * reserved route instead.
 */
export const RESERVED_SITE_SLUGS = new Set(['admin', 'api', 'app', 'login', 'preview', 'www'])

export function isReservedSiteSlug(slug: string): boolean {
    return RESERVED_SITE_SLUGS.has(slug.toLowerCase())
}
