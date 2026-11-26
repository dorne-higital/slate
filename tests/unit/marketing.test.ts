import { describe, expect, it } from 'vitest'
import { MARKETING_PAGES, faqJsonLd, marketingPage } from '../../shared/utils/marketing'

const SPEC_PATHS = [
    '/', '/features', '/features/editor', '/features/domains-and-email', '/features/forms', '/features/seo', '/features/integrations',
    '/websites-for', '/websites-for/trades', '/websites-for/salons-and-clinics', '/websites-for/shops-and-cafes', '/websites-for/clubs-and-charities', '/websites-for/freelancers-and-studios',
    '/pricing', '/compare/wix', '/compare/squarespace', '/compare/wordpress', '/guides', '/help', '/about', '/contact', '/privacy', '/terms'
]

describe('marketing page registry', () => {
    it('paths are unique and start with /', () => {
        const paths = MARKETING_PAGES.map(p => p.path)
        expect(new Set(paths).size).toBe(paths.length)
        paths.forEach(p => expect(p.startsWith('/')).toBe(true))
    })

    it('titles are at most 60 characters and descriptions 120 to 160', () => {
        for (const p of MARKETING_PAGES) {
            expect(p.title.length, p.path).toBeLessThanOrEqual(60)
            expect(p.description.length, p.path).toBeGreaterThanOrEqual(120)
            expect(p.description.length, p.path).toBeLessThanOrEqual(160)
        }
    })

    it('every spec path is present', () => {
        expect(MARKETING_PAGES.map(p => p.path).sort()).toEqual([...SPEC_PATHS].sort())
        expect(marketingPage('/pricing').path).toBe('/pricing')
    })

    it('every page names a share image under /og/', () => {
        MARKETING_PAGES.forEach(p => expect(p.image).toMatch(/^\/og\/[a-z0-9-]+\.png$/))
    })
})

describe('structured data', () => {
    it('faqJsonLd builds FAQPage', () => {
        expect(faqJsonLd([{ q: 'A?', a: 'B.' }])).toEqual({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [{ '@type': 'Question', name: 'A?', acceptedAnswer: { '@type': 'Answer', text: 'B.' } }]
        })
    })
})

describe('sector pages', () => {
    it('every sector has a matching starter layout and a registry page', async () => {
        const { SECTORS } = await import('../../shared/utils/marketingSectors')
        const { STARTER_LAYOUTS } = await import('../../shared/utils/starterLayouts')
        expect(SECTORS.map(s => `/websites-for/${s.slug}`).sort()).toEqual(MARKETING_PAGES.filter(p => p.section === 'for' && p.path !== '/websites-for').map(p => p.path).sort())
        for (const s of SECTORS) expect(STARTER_LAYOUTS.some(l => l.id === s.layoutId), s.slug).toBe(true)
    })

    it('sector pages are genuinely different', async () => {
        const { SECTORS } = await import('../../shared/utils/marketingSectors')
        const problems = SECTORS.flatMap(s => s.problems.map(p => p.title))
        const questions = SECTORS.flatMap(s => s.faq.map(f => f.q))
        expect(new Set(problems).size).toBe(problems.length)
        expect(new Set(questions).size).toBe(questions.length)
        for (const s of SECTORS) {
            expect(s.problems.length, s.slug).toBeGreaterThanOrEqual(3)
            expect(s.features.length, s.slug).toBeGreaterThanOrEqual(4)
            expect(s.faq.length, s.slug).toBeGreaterThanOrEqual(4)
        }
    })
})

describe('pricing structured data', () => {
    it('pricing structured data matches the plans', async () => {
        const { pricingJsonLd } = await import('../../shared/utils/marketing')
        const { PLANS } = await import('../../shared/utils/plans')
        const monthly = PLANS.map(p => p.monthly / 100)
        const d = pricingJsonLd() as { '@type': string, 'offers': Record<string, unknown> }
        expect(d['@type']).toBe('SoftwareApplication')
        expect(d.offers).toMatchObject({
            '@type': 'AggregateOffer',
            'priceCurrency': 'GBP',
            'lowPrice': Math.min(...monthly).toFixed(2),
            'highPrice': Math.max(...monthly).toFixed(2),
            'offerCount': PLANS.length
        })
    })
})

describe('comparison pages', () => {
    it('every comparison is dated and sourced', async () => {
        const { RIVALS } = await import('../../shared/utils/marketingCompare')
        expect(RIVALS.map(r => `/compare/${r.slug}`).sort()).toEqual(MARKETING_PAGES.filter(p => p.section === 'compare').map(p => p.path).sort())
        for (const r of RIVALS) {
            expect(r.checked, r.slug).toBe('26 Nov 2026')
            expect(r.sources.length, r.slug).toBeGreaterThanOrEqual(1)
            for (const s of r.sources) expect(r.domains.some(d => new URL(s.url).hostname.endsWith(d)), `${r.slug} source ${s.url}`).toBe(true)
            for (const row of r.rows) {
                expect(row.slate.trim(), `${r.slug}: ${row.topic}`).not.toBe('')
                expect(row.rival.trim(), `${r.slug}: ${row.topic}`).not.toBe('')
            }
            expect(r.fit.slate.length && r.fit.rival.length, r.slug).toBeTruthy()
        }
    })
})

describe('share images', () => {
    it('every page’s share image exists at 1200×630', async () => {
        const { readFileSync, existsSync } = await import('node:fs')
        const images = [...new Set(MARKETING_PAGES.map(p => p.image))]
        for (const img of images) {
            const file = `public${img}`
            expect(existsSync(file), file).toBe(true)
            const png = readFileSync(file)
            // PNG header: width and height are the big-endian numbers at bytes 16 and 20
            expect([png.readUInt32BE(16), png.readUInt32BE(20)], file).toEqual([1200, 630])
        }
    })
})
