import { existsSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { helpArticle, helpArticles } from '../../server/utils/help'
import { HELP_AREAS } from '../../shared/utils/helpAreas'

const articles = helpArticles()
const raw = (slug: string) => readdirSync('content/help').includes(`${slug}.md`)

describe('help articles', () => {
    it('the bundled copy matches content/help (run yarn help:index)', async () => {
        const { readFileSync } = await import('node:fs')
        const { HELP_FILES } = await import('../../server/utils/helpFiles.generated')
        const onDisk = readdirSync('content/help').filter(f => f.endsWith('.md'))
        expect(Object.keys(HELP_FILES).sort()).toEqual(onDisk.map(f => f.replace(/\.md$/, '')).sort())
        for (const f of onDisk) expect(HELP_FILES[f.replace(/\.md$/, '')], f).toBe(readFileSync(`content/help/${f}`, 'utf8'))
    })

    it('every article has a title, summary and known area', () => {
        expect(articles.length).toBeGreaterThan(0)
        for (const a of articles) {
            expect(a.title.length, a.slug).toBeGreaterThan(0)
            expect(a.title.length, a.slug).toBeLessThanOrEqual(60)
            expect(a.summary.length, a.slug).toBeGreaterThan(0)
            expect(a.summary.length, a.slug).toBeLessThanOrEqual(160)
            expect(HELP_AREAS.map(x => x.key), a.slug).toContain(a.area)
        }
    })

    it('slugs are unique and match file names', () => {
        const slugs = articles.map(a => a.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const s of slugs) expect(raw(s), s).toBe(true)
    })

    it('every help: link and related slug points at an article', () => {
        const slugs = new Set(articles.map(a => a.slug))
        for (const a of articles) {
            for (const r of a.related) expect(slugs.has(r), `${a.slug} related ${r}`).toBe(true)
            for (const m of a.html.matchAll(/href="\/help\/([a-z0-9-]+)"/g)) expect(slugs.has(m[1]!), `${a.slug} links ${m[1]}`).toBe(true)
            expect(a.html, a.slug).not.toContain('help:')
        }
    })

    it('every shot: image exists in public/help', () => {
        for (const a of articles) {
            for (const m of a.html.matchAll(/src="\/help\/([a-z0-9-]+\.png)"/g)) expect(existsSync(`public/help/${m[1]}`), `${a.slug} uses ${m[1]}`).toBe(true)
            expect(a.html, a.slug).not.toContain('shot:')
        }
    })

    it('steps are extracted from the numbered list', () => {
        const a = helpArticle('add-a-page')!
        expect(a.steps.length).toBeGreaterThanOrEqual(3)
        expect(a.steps[0]).toMatch(/^Open/)
        expect(helpArticle('nope')).toBeUndefined()
    })
})
