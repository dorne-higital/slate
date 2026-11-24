import { describe, expect, it } from 'vitest'
import { BLOCK_TYPES, choice, cleanBlocks, newBlock, safeUrl, SECTION_FIELDS } from '../../shared/utils/blockTypes'

describe('safeUrl', () => {
    it('keeps web, mail, phone, on-site and anchor links', () => {
        expect(safeUrl('https://example.com/x')).toBe('https://example.com/x')
        expect(safeUrl('/contact')).toBe('/contact')
        expect(safeUrl('#pricing')).toBe('#pricing')
        expect(safeUrl('mailto:a@b.co')).toBe('mailto:a@b.co')
        expect(safeUrl('tel:+441234')).toBe('tel:+441234')
    })
    it('adds https to bare domains', () => {
        expect(safeUrl('example.co.uk')).toBe('https://example.co.uk')
    })
    it('drops dangerous or odd links', () => {
        for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:x', 'data:text/html,hi', '//evil.com', 'vbscript:x', 'not a url']) {
            expect(safeUrl(bad)).toBe('')
        }
    })
})

describe('cleanBlocks', () => {
    it('drops unknown block types, unknown fields and non-objects', () => {
        const out = cleanBlocks([{ type: 'nope', props: {} }, 'junk', null, { id: 'a', type: 'text', props: { heading: 'Hi', evil: '<script>' } }])
        expect(out).toHaveLength(1)
        expect(out[0]!.props.heading).toBe('Hi')
        expect(out[0]!.props).not.toHaveProperty('evil')
    })
    it('cleans links and images inside blocks and their items', () => {
        const [hero] = cleanBlocks([{ id: 'h', type: 'hero', props: { buttonUrl: 'javascript:x', imageUrl: 'data:image/png;base64,AA' } }])
        expect(hero!.props.buttonUrl).toBe('')
        expect(hero!.props.imageUrl).toBe('')
        const [g] = cleanBlocks([{ id: 'g', type: 'gallery', props: { items: [{ url: 'javascript:x', alt: 'a' }, { url: '/media/x.png' }] } }])
        expect((g!.props.items as { url: string }[]).map(i => i.url)).toEqual(['', '/media/x.png'])
    })
    it('only allows listed choices, falling back to the first', () => {
        const [h] = cleanBlocks([{ id: 'h', type: 'hero', props: { layout: 'evil', sectionBg: 'purple' } }])
        expect(h!.props.layout).toBe('left')
        expect(h!.props.sectionBg).toBe('')
        expect(choice('hero', 'layout', undefined)).toBe('left')
    })
    it('turns a link name into a safe anchor', () => {
        const [t] = cleanBlocks([{ id: 't', type: 'text', props: { sectionAnchor: 'Our Prices! <b>' } }])
        expect(t!.props.sectionAnchor).toBe('our-prices-b')
    })
    it('caps text length, item counts and the number of blocks', () => {
        const [t] = cleanBlocks([{ id: 't', type: 'text', props: { heading: 'x'.repeat(5000) } }])
        expect((t!.props.heading as string).length).toBe(160)
        const [s] = cleanBlocks([{ id: 's', type: 'stats', props: { items: Array.from({ length: 50 }, () => ({ value: '1' })) } }])
        expect((s!.props.items as unknown[]).length).toBe(6)
        expect(cleanBlocks(Array.from({ length: 150 }, () => ({ type: 'text', props: {} })))).toHaveLength(100)
    })
    it('replaces bad ids and only accepts a form id that looks like one', () => {
        const [f] = cleanBlocks([{ id: '../../x', type: 'form', props: { formId: "1' or 1=1" } }])
        expect(f!.id).toMatch(/^[0-9a-f-]{36}$/)
        expect(f!.props.formId).toBe('')
    })
    it('gives every block type usable starting content that survives cleaning', () => {
        for (const def of BLOCK_TYPES) {
            const b = newBlock(def.type)
            const [clean] = cleanBlocks([b])
            expect(clean, def.type).toBeTruthy()
            for (const f of [...def.fields, ...SECTION_FIELDS]) expect(clean!.props, `${def.type}.${f.key}`).toHaveProperty(f.key)
        }
    })
})
