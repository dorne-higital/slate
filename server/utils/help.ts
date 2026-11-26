import { marked } from 'marked'
import { HELP_FILES } from './helpFiles.generated'

/**
 * Help centre articles: Markdown files in content/help, bundled at build time.
 * Frontmatter (between --- lines): title, summary, area, order, related (comma-separated slugs), popular.
 * In the body, [text](help:slug) links to another article and ![alt](shot:name) shows public/help-img/name.png.
 */
export interface HelpArticle {
    slug: string
    title: string
    summary: string
    area: HelpArea
    order: number
    related: string[]
    popular: boolean
    html: string
    /** Each numbered step as plain text, for HowTo structured data */
    steps: string[]
}

export function parseHelpArticle(slug: string, source: string): HelpArticle {
    const m = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!m) throw new Error(`help/${slug}.md needs a --- frontmatter block`)
    const meta = Object.fromEntries(m[1]!.split('\n').filter(Boolean).map((line) => {
        const i = line.indexOf(':')
        return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    })) as Record<string, string>
    const body = m[2]!
        .replace(/\]\(help:([a-z0-9-]+)\)/g, '](/help/$1)')
        .replace(/!\[([^\]]*)\]\(shot:([a-z0-9-]+)\)/g, '![$1](/help-img/$2.png)')
    const tokens = marked.lexer(body)
    const list = tokens.find(t => t.type === 'list' && (t as { ordered?: boolean }).ordered) as { items: { text: string }[] } | undefined
    const plain = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').split('\n')[0]!.trim()
    const html = (marked.parse(body, { async: false }) as string)
        .replace(/<img /g, '<img loading="lazy" width="1280" height="800" ')
    return {
        slug,
        title: meta.title ?? slug,
        summary: meta.summary ?? '',
        area: (meta.area ?? 'getting-started') as HelpArea,
        order: Number(meta.order ?? 99),
        related: (meta.related ?? '').split(',').map(s => s.trim()).filter(Boolean),
        popular: meta.popular === 'true',
        html,
        steps: list?.items.map(i => plain(i.text)).filter(Boolean) ?? []
    }
}

let cache: HelpArticle[] | null = null
export function helpArticles(): HelpArticle[] {
    if (!cache) {
        const areaOrder = (a: HelpArea) => HELP_AREAS.findIndex(x => x.key === a)
        cache = Object.entries(HELP_FILES).map(([slug, s]) => parseHelpArticle(slug, s)).sort((a, b) => areaOrder(a.area) - areaOrder(b.area) || a.order - b.order || a.title.localeCompare(b.title))
    }
    return cache
}

export const helpArticle = (slug: string) => helpArticles().find(a => a.slug === slug)
