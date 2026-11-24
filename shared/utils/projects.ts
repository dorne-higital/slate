/** Where project pages live: /work/{slug} */
export const PROJECTS_PATH = '/work'

/** Keeps only valid project details (used on every save). */
export function cleanProjectMeta(input: unknown): ProjectMeta {
    const t = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
    const img = (v: unknown) => {
        const u = safeUrl(str(v, 1000))
        return u.startsWith('/media/') || u.startsWith('https://') ? u : ''
    }
    const pairs = (v: unknown, a: string, b: string, max: number) => (Array.isArray(v) ? v : []).slice(0, max)
        .map((x: Record<string, unknown>) => ({ [a]: str(x?.[a], 60), [b]: str(x?.[b], 300) }))
        .filter(x => x[a] || x[b])
    return {
        category: str(t.category, 40),
        summary: str(t.summary, 400),
        cover: img(t.cover),
        coverAlt: str(t.coverAlt, 200),
        year: str(t.year, 20),
        featured: t.featured === true,
        details: pairs(t.details, 'label', 'value', 10) as { label: string, value: string }[],
        links: (pairs(t.links, 'label', 'url', 4) as { label: string, url: string }[]).map(l => ({ label: l.label, url: safeUrl(l.url) })).filter(l => l.label && l.url)
    }
}
