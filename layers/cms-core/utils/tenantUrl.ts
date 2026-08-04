/**
 * Builds the URL for a reserved (`admin`) or site-slug subdomain of the
 * current host.
 *
 * In dev — `currentHost` is `localhost` or `*.localhost`, any port — that's
 * always `{subdomain}.localhost:{port}`: the browser resolves any
 * `*.localhost` address automatically (RFC 6761), no setup needed, exactly
 * how resolve-tenant-domain.ts already recognizes it server-side.
 *
 * Otherwise, once NUXT_PUBLIC_BASE_DOMAIN is configured (see README.md
 * "Wildcard subdomains per site") that's `{subdomain}.{baseDomain}`,
 * falling back to an internal path before that DNS/cert work is done.
 */
export function buildTenantUrl(currentHost: string, subdomain: string, baseDomain: string, fallbackPath: string): string {
    const hostname = currentHost.split(':')[0] ?? currentHost
    const port = currentHost.slice(hostname.length)

    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
        return `http://${subdomain}.localhost${port}`
    }

    if (baseDomain) {
        return `https://${subdomain}.${baseDomain}`
    }

    return fallbackPath
}
