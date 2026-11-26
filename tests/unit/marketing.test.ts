import { describe, expect, it } from 'vitest'
import { MARKETING_PAGES, marketingPage } from '../../shared/utils/marketing'

const SPEC_PATHS = [
    '/', '/features', '/features/editor', '/features/domains-and-email', '/features/forms', '/features/seo', '/features/integrations',
    '/for/trades', '/for/salons-and-clinics', '/for/shops-and-cafes', '/for/clubs-and-charities', '/for/freelancers-and-studios',
    '/pricing', '/compare/wix', '/compare/squarespace', '/compare/wordpress', '/guides', '/about', '/contact', '/privacy', '/terms'
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
