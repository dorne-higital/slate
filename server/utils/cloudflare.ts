/**
 * Cloudflare for SaaS: each client domain is a "custom hostname" on the slatecms.co.uk zone.
 * Cloudflare issues its HTTPS certificate once the client's DNS points at our fallback origin,
 * and the Worker's catch-all route then serves it like any other client site.
 */
interface CfCustomHostname {
    id: string
    hostname: string
    status: string
    ssl?: { status?: string, validation_errors?: { message: string }[] }
    verification_errors?: string[]
    ownership_verification?: { type: string, name: string, value: string }
}

interface CfResponse<T> {
    success: boolean
    result: T
    errors: { code: number, message: string }[]
}

function cfConfig() {
    const { cloudflareApiToken, cloudflareZoneId } = useRuntimeConfig()
    if (!cloudflareApiToken || !cloudflareZoneId) {
        throw createError({ statusCode: 503, statusMessage: 'Custom domains aren’t switched on yet. The site owner needs to finish the Cloudflare setup.' })
    }
    return { token: cloudflareApiToken, zone: cloudflareZoneId }
}

async function cf<T>(path: string, init: { method?: string, body?: unknown } = {}): Promise<CfResponse<T>> {
    const { token, zone } = cfConfig()
    const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zone}${path}`, {
        method: init.method ?? 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: init.body ? JSON.stringify(init.body) : undefined
    })
    return await res.json() as CfResponse<T>
}

export async function createCustomHostname(hostname: string) {
    const res = await cf<CfCustomHostname>('/custom_hostnames', {
        method: 'POST',
        body: { hostname, ssl: { method: 'http', type: 'dv', settings: { min_tls_version: '1.2' } } }
    })
    if (!res.success) {
        // 1406: already exists on this zone (e.g. a retry after a half-finished add)
        if (res.errors.some(e => e.code === 1406)) {
            const existing = await findCustomHostname(hostname)
            if (existing) return existing
        }
        throw createError({ statusCode: 400, statusMessage: res.errors[0]?.message ?? 'Cloudflare couldn’t add that domain' })
    }
    return res.result
}

export async function findCustomHostname(hostname: string) {
    const res = await cf<CfCustomHostname[]>(`/custom_hostnames?hostname=${encodeURIComponent(hostname)}`)
    return res.success ? res.result[0] ?? null : null
}

export async function getCustomHostname(id: string) {
    const res = await cf<CfCustomHostname>(`/custom_hostnames/${id}`)
    return res.success ? res.result : null
}

export async function deleteCustomHostname(id: string) {
    await cf(`/custom_hostnames/${id}`, { method: 'DELETE' })
}

/** The TXT record that proves we own the hostname, while Cloudflare still can't verify it any other way. */
export function ownershipRecord(h: CfCustomHostname | null) {
    if (!h || h.status === 'active' || !h.ownership_verification?.name || !h.ownership_verification.value) return null
    return { name: h.ownership_verification.name, value: h.ownership_verification.value }
}

/** Our simple status from Cloudflare's: live only once both the hostname and its certificate are active. */
export function summariseHostname(h: CfCustomHostname | null): { status: 'pending' | 'active' | 'error', detail: string | null } {
    if (!h) return { status: 'error', detail: 'Cloudflare has no record of this domain. Remove it and add it again.' }
    if (h.status === 'active' && h.ssl?.status === 'active') return { status: 'active', detail: null }
    const problem = h.ssl?.validation_errors?.[0]?.message ?? h.verification_errors?.[0]
    if (h.status === 'blocked' || h.status === 'moved') return { status: 'error', detail: problem ?? `Cloudflare marked this domain as ${h.status}.` }
    return { status: 'pending', detail: null }
}
