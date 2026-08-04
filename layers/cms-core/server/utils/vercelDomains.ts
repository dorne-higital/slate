/**
 * Thin wrapper over Vercel's REST API for attaching a customer's own
 * domain to this one Vercel project — the piece resolve-tenant-domain.ts
 * can't do on its own: it only serves a request once traffic for that
 * hostname is *already* reaching this deployment (Vercel routing it +
 * issuing a cert), which requires the domain to be registered against
 * the project here first.
 *
 * Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID (server-only env vars —
 * see app/.env.example). VERCEL_TEAM_ID is only needed when the project
 * lives under a Vercel Team rather than a personal account.
 */

const VERCEL_API_BASE = 'https://api.vercel.com'

function vercelConfig() {
    const token = process.env.VERCEL_API_TOKEN
    const projectId = process.env.VERCEL_PROJECT_ID
    const teamId = process.env.VERCEL_TEAM_ID

    if (!token || !projectId) {
        throw createError({ statusCode: 500, statusMessage: 'VERCEL_API_TOKEN / VERCEL_PROJECT_ID are not configured' })
    }

    return { token, projectId, teamId }
}

function withTeam(path: string, teamId: string | undefined) {
    return teamId ? `${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}` : path
}

class VercelApiError extends Error {
    status: number
    data: { error?: { message?: string } } | null

    constructor(status: number, data: { error?: { message?: string } } | null) {
        super(data?.error?.message ?? `Vercel API responded ${status}`)
        this.status = status
        this.data = data
    }
}

// Nuxt's auto-imported $fetch types its response against this app's OWN
// internal routes (that's what breaks here, with a stack-depth error) —
// it's meant for calling your own API, not a third-party one. Plain
// global fetch (Node 22+) is the right tool for an external API.
async function vercelFetch<T>(path: string, options: { method?: string, body?: unknown } = {}): Promise<T> {
    const { token, teamId } = vercelConfig()

    const response = await fetch(withTeam(`${VERCEL_API_BASE}${path}`, teamId), {
        method: options.method ?? 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
        throw new VercelApiError(response.status, data)
    }

    return data as T
}

export interface VercelDomainVerification {
    type: string
    domain: string
    value: string
    reason: string
}

export interface VercelDomainStatus {
    verified: boolean
    verification: VercelDomainVerification[]
}

/**
 * Registers a domain against the Vercel project. Idempotent in practice —
 * a domain that's already attached to this same project comes back as a
 * 409 from Vercel, which is treated as success rather than an error.
 *
 * `redirectTo`, when given, registers this domain as a redirect-only
 * entry (Vercel serves a 308 to redirectTo rather than this project's
 * content) — that's how the www/apex counterpart of whatever the
 * customer actually typed gets attached: registered, but pointing back
 * at the one real, canonical hostname, rather than serving the site
 * twice under two names.
 */
export async function addDomainToVercel(domain: string, redirectTo?: string): Promise<VercelDomainStatus> {
    const { projectId } = vercelConfig()

    try {
        const result = await vercelFetch<VercelDomainStatus>(`/v10/projects/${projectId}/domains`, {
            method: 'POST',
            body: redirectTo ? { name: domain, redirect: redirectTo, redirectStatusCode: 308 } : { name: domain }
        })
        return { verified: result.verified, verification: result.verification ?? [] }
    } catch (error) {
        if (isAlreadyAttachedError(error)) {
            return await getDomainStatus(domain)
        }
        throw createError({ statusCode: 400, statusMessage: `Vercel rejected "${domain}": ${vercelErrorMessage(error)}` })
    }
}

/**
 * The www/apex sibling of a domain — jbcleaning.co.uk <-> www.jbcleaning.co.uk.
 * Whichever one the customer actually typed into Settings stays canonical
 * (what the site really serves); this is the "also register the other
 * one, as a redirect back to it" half, so both forms work without
 * serving duplicate content under two hostnames.
 */
export function domainCounterpart(domain: string): string {
    return domain.startsWith('www.') ? domain.slice(4) : `www.${domain}`
}

/** Detaches a domain from the project — called when a site clears its custom_domain, so it doesn't linger registered against this project forever. */
export async function removeDomainFromVercel(domain: string): Promise<void> {
    const { projectId } = vercelConfig()

    try {
        await vercelFetch(`/v9/projects/${projectId}/domains/${domain}`, { method: 'DELETE' })
    } catch (error) {
        // Already gone (or never actually got added) — not worth failing
        // the site update over, the customer's own goal (stop serving
        // that domain) is already true either way.
        if (!isNotFoundError(error)) throw error
    }
}

/**
 * Live verification + DNS-configuration status for a domain already
 * registered against this project — what the Settings page polls for its
 * Verified/Pending badge.
 */
export async function getDomainStatus(domain: string): Promise<VercelDomainStatus> {
    const { projectId } = vercelConfig()

    const [domainInfo, config] = await Promise.all([
        vercelFetch<{ verified: boolean, verification?: VercelDomainVerification[] }>(`/v9/projects/${projectId}/domains/${domain}`),
        vercelFetch<{ misconfigured: boolean }>(`/v6/domains/${domain}/config`)
    ])

    return {
        verified: domainInfo.verified && !config.misconfigured,
        verification: domainInfo.verification ?? []
    }
}

/**
 * The DNS record a customer needs to add at their own registrar — Vercel's
 * stable, documented routing targets (not something that varies per
 * domain). Root/apex domains (jbcleaning.co.uk) need an A record, since
 * a bare apex can't hold a CNAME per the DNS spec; anything with a
 * subdomain (www.jbcleaning.co.uk) uses a CNAME instead. Multi-part
 * public suffixes (.co.uk, .com.au, ...) make "is this the apex" not
 * fully decidable from dot-count alone — this is a best-effort default,
 * the customer's own registrar UI will say plainly if an A record isn't
 * accepted for what they typed.
 */
export function suggestedDnsRecord(domain: string): { type: 'A' | 'CNAME', name: string, value: string } {
    const labels = domain.split('.')
    const looksLikeApex = labels.length <= 2

    return looksLikeApex
        ? { type: 'A', name: '@', value: '76.76.21.21' }
        : { type: 'CNAME', name: labels[0] ?? domain, value: 'cname.vercel-dns.com' }
}

function isAlreadyAttachedError(error: unknown): boolean {
    return error instanceof VercelApiError && error.status === 409
}

function isNotFoundError(error: unknown): boolean {
    return error instanceof VercelApiError && error.status === 404
}

function vercelErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error'
}
