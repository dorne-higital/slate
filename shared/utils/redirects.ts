/**
 * Redirects: an old address on the site sends visitors to a new one. Old addresses are matched
 * ignoring case, a trailing slash and anything after "?" or "#". A page that exists always wins.
 */
const RESERVED = /^\/(api|_nuxt|media|\.well-known|_404|_offline)(\/|$)|^\/(sitemap\.xml|robots\.txt|indexnow-key\.txt|favicon\.ico|get-app)$/i

/** The form an old address is stored and looked up in. */
export function redirectKey(path: string) {
    let p = path.split(/[?#]/)[0] ?? ''
    try {
        p = decodeURI(p)
    } catch {
        // Leave malformed escapes as they are
    }
    p = p.toLowerCase().replace(/\/+$/, '')
    return p.startsWith('/') ? p : `/${p}`
}

/** An old address someone pasted (a path, or a full link to their old site) as a stored key; null if it can't be one. */
export function cleanRedirectFrom(raw: unknown): string | null {
    let v = typeof raw === 'string' ? raw.trim() : ''
    if (!v) return null
    if (/^https?:\/\//i.test(v)) {
        try {
            v = new URL(v).pathname
        } catch {
            return null
        }
    }
    if (!v.startsWith('/')) v = `/${v}`
    const key = redirectKey(v)
    if (key === '/' || key.length > 300 || RESERVED.test(key) || /\s/.test(key)) return null
    return key
}

/** Where to send people: a path on this site or a full https/http link. */
export function cleanRedirectTo(raw: unknown): string | null {
    const v = safeUrl(typeof raw === 'string' ? raw.trim().slice(0, 1000) : '')
    if (!v || !(v.startsWith('/') || /^https?:\/\//i.test(v))) return null
    return v
}

/** Parses pasted lines like "/old-page /new-page" or "old-site.com/a, https://x.com/b". */
export function parseRedirectLines(text: string) {
    return text.split('\n').map(l => l.trim()).filter(Boolean).map((line) => {
        const [from = '', to = ''] = line.split(/[\s,]+/).filter(Boolean)
        return { from, to }
    })
}
