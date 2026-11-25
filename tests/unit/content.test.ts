import { describe, expect, it } from 'vitest'
import { cleanProjectMeta } from '../../shared/utils/projects'
import { cleanMenuItems } from '../../shared/utils/menus'
import { slugify } from '../../shared/utils/slugify'
import { cleanFormInput } from '../../shared/utils/forms'

describe('projects', () => {
    it('cleans project details', () => {
        const p = cleanProjectMeta({ cover: 'javascript:x', featured: 'yes', links: [{ label: 'Go', url: 'example.com' }, { label: 'Bad', url: 'javascript:x' }, { label: '', url: 'https://x.com' }], details: Array.from({ length: 20 }, () => ({ label: 'a', value: 'b' })) })
        expect(p.cover).toBe('')
        expect(p.featured).toBe(false)
        expect(p.links).toEqual([{ label: 'Go', url: 'https://example.com' }])
        expect(p.details).toHaveLength(10)
    })
})

describe('menus', () => {
    it('drops dangerous links and dropdowns in the footer', () => {
        const header = cleanMenuItems([{ label: 'A', url: 'javascript:x' }, { label: 'B', url: '/b', depth: 1 }], 'header')
        expect(header.find(i => i.label === 'A')?.url ?? '').toBe('')
        const footer = cleanMenuItems([{ label: 'B', url: '/b', depth: 1 }], 'footer')
        expect(footer.every(i => i.depth === 0)).toBe(true)
    })
})

describe('slugify', () => {
    it('makes web-safe addresses', () => {
        expect(slugify('Connelly Upholstery!')).toBe('connelly-upholstery')
        expect(slugify('  Café & Bar  ')).toMatch(/^[a-z0-9-]+$/)
        expect(slugify('../../etc')).not.toContain('/')
    })
})

describe('forms', () => {
    it('keeps only known field kinds and caps fields', () => {
        const f = cleanFormInput({ name: 'Contact', fields: [{ label: 'Name', kind: 'script' }, { label: '', kind: 'text' }, ...Array.from({ length: 40 }, (_, i) => ({ label: `F${i}`, kind: 'text' }))] })
        expect(f.fields[0]!.kind).toBe('text')
        expect(f.fields.every(x => x.label)).toBe(true)
        expect(f.fields.length).toBeLessThanOrEqual(30)
    })
})

describe('multi-step forms', () => {
    const q = (id: string, kind = 'text', required = false) => ({ id, label: id, kind, required }) as const
    it('splits questions into steps at each break, naming steps from the break', async () => {
        const { formSteps } = await import('../../shared/utils/forms')
        const steps = formSteps([{ id: 's0', label: 'About you', kind: 'step', required: false }, q('a'), q('b'), { id: 's1', label: 'Your project', kind: 'step', required: false }, q('c'), { id: 's2', label: '', kind: 'step', required: false }])
        expect(steps.map(s => [s.title, s.fields.map(f => f.id)])).toEqual([['About you', ['a', 'b']], ['Your project', ['c']]])
        expect(formSteps([q('a'), q('b')])).toHaveLength(1)
    })
    it('keeps step breaks without a title, and ignores them when checking answers', async () => {
        const { cleanFormInput, validateSubmission } = await import('../../shared/utils/forms')
        const f = cleanFormInput({ fields: [{ label: 'Name', kind: 'text', required: true }, { label: '', kind: 'step', required: true }, { label: 'Email', kind: 'email' }] })
        expect(f.fields.map(x => x.kind)).toEqual(['text', 'step', 'email'])
        expect(f.fields[1]!.required).toBe(false)
        const r = validateSubmission(f, { [f.fields[0]!.id]: 'Dan' })
        expect(r.ok && Object.keys(r.data)).toEqual(['Name'])
    })
})
