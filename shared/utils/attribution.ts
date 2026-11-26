/**
 * Where a visitor to slatecms.co.uk first came from, saved with their waiting-list entry or sign-up.
 * ref: the other site's hostname · landing: the first page they saw · utm: utm_source (and campaign) · at: when
 */
export interface VisitSource {
    ref?: string
    landing?: string
    utm?: string
    at?: string
}

const short = (v: unknown, n: number) => typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined

/** Checks a source sent by a browser: known fields only, short, and a landing page that's a path. */
export function cleanSource(input: unknown): VisitSource | null {
    if (!input || typeof input !== 'object') return null
    const i = input as Record<string, unknown>
    const landing = short(i.landing, 200)
    if (landing && !landing.startsWith('/')) return null
    const out: VisitSource = {}
    const ref = short(i.ref, 120)?.toLowerCase().replace(/[^a-z0-9.-]/g, '')
    if (ref) out.ref = ref
    if (landing) out.landing = landing
    const utm = short(i.utm, 80)
    if (utm) out.utm = utm
    const at = short(i.at, 40)
    if (at && !Number.isNaN(Date.parse(at))) out.at = at
    return out
}

const KNOWN: [RegExp, string][] = [
    [/(^|\.)google\./, 'Google'],
    [/(^|\.)bing\.com$/, 'Bing'],
    [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
    [/(^|\.)yahoo\./, 'Yahoo'],
    [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'Facebook'],
    [/(^|\.)instagram\.com$/, 'Instagram'],
    [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
    [/(^|\.)(x\.com|twitter\.com|t\.co)$/, 'X (Twitter)'],
    [/(^|\.)tiktok\.com$/, 'TikTok'],
    [/(^|\.)reddit\.com$/, 'Reddit'],
    [/(^|\.)youtube\.com$/, 'YouTube'],
    [/(^|\.)(chatgpt\.com|openai\.com)$/, 'ChatGPT'],
    [/(^|\.)perplexity\.ai$/, 'Perplexity'],
    [/(^|\.)claude\.ai$/, 'Claude'],
    [/(^|\.)gemini\.google\.com$/, 'Gemini']
]

/** A plain name for where someone came from: a campaign, a known site, the other site's address, or direct. */
export function sourceLabel(s: VisitSource | null | undefined): string {
    if (!s) return 'Not recorded'
    if (s.utm) return `Campaign: ${s.utm}`
    if (!s.ref) return 'Direct or unknown'
    // Gemini before Google: it's a google.com subdomain
    const gemini = KNOWN.find(([, n]) => n === 'Gemini')!
    if (gemini[0].test(s.ref)) return 'Gemini'
    return KNOWN.find(([re]) => re.test(s.ref!))?.[1] ?? s.ref.replace(/^www\./, '')
}

/** Counts people per source (and how many of them pay), biggest first. */
export function tallySources(items: { source: VisitSource | null | undefined, paying?: boolean }[]): { label: string, count: number, paying: number }[] {
    const map = new Map<string, { label: string, count: number, paying: number }>()
    for (const i of items) {
        const label = sourceLabel(i.source)
        const row = map.get(label) ?? { label, count: 0, paying: 0 }
        row.count++
        if (i.paying) row.paying++
        map.set(label, row)
    }
    return [...map.values()].sort((a, b) => b.count - a.count || b.paying - a.paying)
}
