import { and, eq } from 'drizzle-orm'

/**
 * Domains Slate sells get their own (free) Cloudflare zone instead of name.com's DNS. Cloudflare for SaaS
 * can't take a bare domain whose DNS points at Cloudflare by address (name.com's ANAME does exactly that),
 * so the zone does two simple things: www is a plain CNAME to Slate (a normal custom hostname), and the
 * bare domain redirects to https://www… with Cloudflare's own certificate.
 */
interface Cf<T> { success: boolean, result: T, errors: { code: number, message: string }[] }

async function cf<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown): Promise<T> {
    const token = useRuntimeConfig().cloudflareDomainsToken
    if (!token) throw new Error('Domain zones aren’t set up (no NUXT_CLOUDFLARE_DOMAINS_TOKEN)')
    const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
        method,
        headers: { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({ success: false, errors: [{ code: res.status, message: `Cloudflare ${res.status}` }] })) as Cf<T>
    if (!data.success) throw new Error(`Cloudflare: ${data.errors?.map(e => e.message).join('; ') || res.status}`)
    return data.result
}

export function domainZonesEnabled() {
    return !!useRuntimeConfig().cloudflareDomainsToken
}

let accountId: string | null = null
async function account() {
    if (!accountId) accountId = (await cf<{ account: { id: string } }>('GET', `/zones/${useRuntimeConfig().cloudflareZoneId}`)).account.id
    return accountId
}

interface Zone { id: string, name: string, status: string, name_servers: string[] }

async function ensureZone(apex: string): Promise<Zone> {
    const found = await cf<Zone[]>('GET', `/zones?name=${encodeURIComponent(apex)}`)
    if (found[0]) return found[0]
    return cf<Zone>('POST', '/zones', { name: apex, account: { id: await account() }, type: 'full' })
}

/** www → Slate (not proxied, so Cloudflare for SaaS sees the CNAME); bare domain → redirect to www. Safe to re-run. */
async function setUpRecords(zoneId: string, apex: string) {
    const target = useRuntimeConfig().public.cnameTarget
    const records = await cf<{ id: string, type: string, name: string, content: string }[]>('GET', `/zones/${zoneId}/dns_records?per_page=100`)
    const www = `www.${apex}`
    if (!records.some(r => r.name === www)) {
        await cf('POST', `/zones/${zoneId}/dns_records`, { type: 'CNAME', name: www, content: target, proxied: false, ttl: 300, comment: 'Slate site' })
    }
    if (!records.some(r => r.name === apex && ['A', 'AAAA', 'CNAME'].includes(r.type))) {
        // A placeholder address (192.0.2.1 is reserved for documentation): proxied, so the redirect rule answers first
        await cf('POST', `/zones/${zoneId}/dns_records`, { type: 'A', name: apex, content: '192.0.2.1', proxied: true, comment: 'Redirects to www (Slate)' })
    }
    await cf('PUT', `/zones/${zoneId}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
        rules: [{
            description: 'Bare domain to www (Slate)',
            expression: `(http.host eq "${apex}")`,
            action: 'redirect',
            action_parameters: { from_value: { status_code: 301, preserve_query_string: true, target_url: { expression: `concat("https://${www}", http.request.uri.path)` } } }
        }]
    })
}

/**
 * Moves a domain Slate registered onto its own Cloudflare zone and connects www.{domain} to the site
 * as its main address. The bare domain stops being a custom hostname (it only redirects now).
 */
export async function moveDomainToZone(order: typeof schema.domainOrders.$inferSelect) {
    const db = useDb()
    const apex = order.domainName
    const zone = await ensureZone(apex)
    await setUpRecords(zone.id, apex)
    if (zone.status !== 'active') await setNameservers(apex, zone.name_servers)
    await db.update(schema.domainOrders).set({ cloudflareZoneId: zone.id, updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
    // Ask Cloudflare to look for the new nameservers now rather than on its own schedule
    await cf('PUT', `/zones/${zone.id}/activation_check`).catch(() => {})

    const site = order.siteId ? await db.query.sites.findFirst({ where: eq(schema.sites.id, order.siteId) }) : null
    if (!site || site.deletedAt) return
    const www = `www.${apex}`
    const existing = await db.query.domains.findFirst({ where: eq(schema.domains.hostname, www) })
    if (existing && existing.siteId !== site.id) throw new Error(`${www} is connected to another site`)
    if (!existing) {
        const h = await createCustomHostname(www)
        await db.insert(schema.domains).values({ hostname: www, siteId: site.id, cloudflareId: h.id, status: 'pending' }).onConflictDoNothing()
    }
    const bare = await db.query.domains.findFirst({ where: and(eq(schema.domains.hostname, apex), eq(schema.domains.siteId, site.id)) })
    if (bare) {
        if (bare.cloudflareId) await deleteCustomHostname(bare.cloudflareId).catch(() => {})
        await db.delete(schema.domains).where(eq(schema.domains.hostname, apex))
    }
    if (!site.customDomain || site.customDomain === apex) {
        await db.update(schema.sites).set({ customDomain: www, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
    }
}
