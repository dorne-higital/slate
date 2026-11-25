/**
 * name.com reseller API (v4). Availability checks are read-only and always use the real API.
 *
 * Registering spends money from Slate's name.com balance, so it only really happens when
 * `domainRegistrationLive()` is true: the live name.com account AND a live-mode Stripe key
 * (so the customer's payment was real). Otherwise orders are simulated end to end.
 */

interface NamecomResult { domainName: string, tld: string, purchasable?: boolean, premium?: boolean, purchasePrice?: number, purchaseType?: string, renewalPrice?: number }

async function namecom<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
    const { namecomUsername, namecomToken } = useRuntimeConfig()
    if (!namecomUsername || !namecomToken) throw createError({ statusCode: 503, statusMessage: 'Buying domains isn’t set up yet' })
    const res = await fetch(`https://api.name.com/v4/${path}`, {
        method,
        headers: { 'authorization': `Basic ${btoa(`${namecomUsername}:${namecomToken}`)}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
    })
    const data = await res.json().catch(() => ({})) as T & { message?: string, details?: string }
    if (!res.ok) {
        console.error('[namecom]', method, path, res.status, data.message, data.details)
        throw new Error(data.message ?? `name.com ${res.status}`)
    }
    return data
}

export function domainRegistrationLive() {
    return stripeIsLive()
}

/** Why a name can't be sold, or null if it can (checks premium names and our margin). */
export function unsellableReason(r: NamecomResult): string | null {
    const price = DOMAIN_PRICES[r.tld]
    if (!price) return 'We don’t sell this ending'
    if (!r.purchasable) return 'Taken'
    if (r.premium || (r.purchaseType && r.purchaseType !== 'registration')) return 'Premium name, not available through Slate'
    const costPence = Math.max(r.purchasePrice ?? 0, r.renewalPrice ?? 0) * USD_TO_GBP * 100
    if (costPence + DOMAIN_MIN_MARGIN > price) return 'Not available through Slate right now'
    return null
}

export async function checkDomains(names: string[]): Promise<{ result: NamecomResult, option: DomainOption }[]> {
    const { results } = await namecom<{ results: NamecomResult[] }>('POST', 'domains:checkAvailability', { domainNames: names })
    return names.map((name) => {
        const r = results.find(x => x.domainName === name) ?? { domainName: name, tld: name.split('.').slice(1).join('.') }
        const reason = unsellableReason(r)
        return { result: r, option: { domain: name, tld: r.tld, available: !reason, price: reason ? null : DOMAIN_PRICES[r.tld]!, reason: reason ?? undefined } }
    })
}

export interface Registrant {
    firstName: string
    lastName: string
    companyName?: string
    address1: string
    address2?: string
    city: string
    state?: string
    zip: string
    country: string
    phone: string
    email: string
}

/** Registers the domain for a year with auto-renew on, using the customer as every contact. */
export async function registerDomain(domainName: string, contact: Registrant) {
    const { result } = (await checkDomains([domainName]))[0]!
    if (unsellableReason(result)) throw new Error('No longer available')
    const contacts = { registrant: contact, admin: contact, tech: contact, billing: contact }
    const res = await namecom<{ domain: { expireDate?: string } }>('POST', 'domains', {
        domain: { domainName, contacts, autorenewEnabled: true },
        purchasePrice: result.purchasePrice,
        years: 1
    })
    return { expiresAt: res.domain?.expireDate ? new Date(res.domain.expireDate) : null }
}

/** The domain if it's already in Slate's name.com account, or null. */
export async function ownedDomain(domainName: string): Promise<{ expiresAt: Date | null } | null> {
    try {
        const d = await namecom<{ domainName?: string, expireDate?: string }>('GET', `domains/${domainName}`)
        return d.domainName ? { expiresAt: d.expireDate ? new Date(d.expireDate) : null } : null
    } catch {
        return null
    }
}

/** .uk names don't use transfer codes: Nominet moves them by changing the IPS tag. */
export function isUkDomain(domainName: string) {
    return /\.uk$/i.test(domainName)
}

/** Unlocks the domain and returns its transfer (EPP/auth) code, for moving it to another registrar. */
export async function transferCode(domainName: string) {
    await namecom('POST', `domains/${domainName}:unlock`).catch(() => {})
    const { authCode } = await namecom<{ authCode?: string }>('GET', `domains/${domainName}:getAuthCode`)
    if (!authCode) throw new Error('name.com didn’t return a code')
    return authCode
}

/** Points the domain at Slate: apex via ANAME, www via CNAME, both to the fallback origin. */
export async function pointDomainAtSlate(domainName: string) {
    const target = useRuntimeConfig().public.cnameTarget
    await namecom('POST', `domains/${domainName}/records`, { host: '', type: 'ANAME', answer: target, ttl: 300 })
    await namecom('POST', `domains/${domainName}/records`, { host: 'www', type: 'CNAME', answer: target, ttl: 300 })
}

/** Adds a TXT record unless the same one is already there. */
export async function ensureTxtRecord(domainName: string, host: string, answer: string) {
    const { records = [] } = await namecom<{ records?: { host?: string, type: string, answer: string }[] }>('GET', `domains/${domainName}/records`)
    if (records.some(r => r.type === 'TXT' && (r.host ?? '') === host && r.answer.replace(/"/g, '') === answer)) return false
    await namecom('POST', `domains/${domainName}/records`, { host, type: 'TXT', answer, ttl: 300 })
    return true
}

export async function setAutorenew(domainName: string, on: boolean) {
    await namecom('POST', `domains/${domainName}:${on ? 'enableAutorenew' : 'disableAutorenew'}`)
}

/** Phone as name.com wants it: +44.2071234567 */
export function namecomPhone(raw: string | null | undefined, country: string) {
    const digits = String(raw ?? '').replace(/[^\d+]/g, '')
    if (digits.startsWith('+')) return `+${digits.slice(1, 3)}.${digits.slice(3)}`
    if (country === 'GB' && digits.startsWith('0')) return `+44.${digits.slice(1)}`
    return `+44.${digits}`
}
