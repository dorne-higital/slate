/** Where a client site's blog lives. Pages can't use this address. */
export const BLOG_PATH = '/blog'

export type PostState = 'draft' | 'scheduled' | 'published'

/** Draft, scheduled (published with a future date) or published. */
export function postState(p: { status: PageStatus, publishedAt: string | Date | null }, now = new Date()): PostState {
    if (p.status !== 'published' || !p.publishedAt) return 'draft'
    return new Date(p.publishedAt) > now ? 'scheduled' : 'published'
}

export type PostPart =
    | { kind: 'p', text: string }
    | { kind: 'h', text: string }
    | { kind: 'ul', items: string[] }

/** Turns a post's plain-text body into paragraphs, headings and lists. Rendered as text, never HTML. */
export function parsePostBody(body: string): PostPart[] {
    const parts: PostPart[] = []
    for (const chunk of body.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
        const lines = chunk.split('\n').map(l => l.trimEnd()).filter(l => l.trim())
        if (!lines.length) continue
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) {
            parts.push({ kind: 'ul', items: lines.map(l => l.replace(/^\s*[-*]\s+/, '')) })
        } else if (lines.length === 1 && /^#{1,3}\s+/.test(lines[0]!)) {
            parts.push({ kind: 'h', text: lines[0]!.replace(/^#{1,3}\s+/, '') })
        } else {
            parts.push({ kind: 'p', text: lines.join('\n') })
        }
    }
    return parts
}

/** A short summary: the excerpt, or the start of the first paragraph. */
export function postSummary(p: { excerpt?: string | null, body: string }, max = 180): string {
    if (p.excerpt?.trim()) return p.excerpt.trim()
    const first = parsePostBody(p.body).find(x => x.kind === 'p') as { text: string } | undefined
    const text = first?.text.replace(/\s+/g, ' ') ?? ''
    return text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, '')}…` : text
}

export function readingMinutes(body: string): number {
    return Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 220))
}
