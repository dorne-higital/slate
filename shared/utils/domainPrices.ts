/**
 * Domains Slate sells, at one flat price a year (pence), first year and renewals alike.
 * name.com charges us in US dollars; a domain is only offered when its dearer of
 * registration/renewal cost, converted and plus a margin, fits under this price.
 * Change prices here; existing domains keep the price they were bought at.
 */
export const DOMAIN_PRICES: Record<string, number> = {
    'co.uk': 1200,
    'uk': 1400,
    'org.uk': 1200,
    'com': 2400,
    'org': 2200,
    'net': 2600
}

/** Order shown in search results */
export const DOMAIN_TLDS = Object.keys(DOMAIN_PRICES)

/** Conservative dollars-to-pounds rate, and the least we want to keep per domain per year (pence) */
export const USD_TO_GBP = 0.82
export const DOMAIN_MIN_MARGIN = 200

/** "Bramble & Oak!" or "brambleandoak.co.uk" → "brambleandoak" (a domain name's first part) */
export function domainKeyword(input: string): string {
    let v = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
    for (const tld of [...DOMAIN_TLDS].sort((a, b) => b.length - a.length)) {
        if (v.endsWith(`.${tld}`)) {
            v = v.slice(0, -tld.length - 1)
            break
        }
    }
    return v.replace(/&/g, 'and').replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 63)
}

export interface DomainOption {
    domain: string
    tld: string
    available: boolean
    /** Pence a year; null when not offered */
    price: number | null
    reason?: string
}

export type DomainOrderStatus = 'pending_payment' | 'registering' | 'active' | 'failed' | 'cancelled'
