import { computed, reactive, ref, watch } from 'vue'
import { beforeAll, describe, expect, it } from 'vitest'

let useDataTable: typeof import('../../app/composables/useDataTable').useDataTable
beforeAll(async () => {
    // Nuxt auto-imports these; outside Nuxt they need to exist before the composable loads
    Object.assign(globalThis, { computed, reactive, ref, watch })
    useDataTable = (await import('../../app/composables/useDataTable')).useDataTable
})

const pages = [
    { title: 'Contact', path: '/contact', updated: '2026-11-03' },
    { title: 'Home', path: '/', updated: '2026-11-01' },
    { title: 'about', path: '/about', updated: '2026-11-05' },
    { title: 'Work 10', path: '/work-10', updated: '' },
    { title: 'Work 9', path: '/work-9', updated: '2026-11-02' }
]

describe('useDataTable', () => {
    it('sorts A–Z ignoring case and numbers naturally, keeps Home first, empties last', () => {
        const t = useDataTable(() => pages, { sorters: { title: p => p.title, updated: p => p.updated }, pin: p => p.path === '/' })
        t.sortBy('title')
        expect(t.all.map(p => p.title)).toEqual(['Home', 'about', 'Contact', 'Work 9', 'Work 10'])
        t.sortBy('title')
        expect(t.all.map(p => p.title)).toEqual(['Home', 'Work 10', 'Work 9', 'Contact', 'about'])
        t.sortBy('updated')
        expect(t.all.at(-1)!.title).toBe('Work 10')
        t.sortBy('updated')
        t.sortBy('updated')
        expect(t.sortKey).toBeNull()
    })

    it('searches and pages', async () => {
        const many = Array.from({ length: 30 }, (_, i) => ({ title: `Page ${i + 1}` }))
        const t = useDataTable(() => many, { search: p => p.title, pageSize: 10 })
        expect(t.pageCount).toBe(3)
        t.page = 3
        expect(t.rows[0]!.title).toBe('Page 21')
        expect([t.from, t.to, t.total]).toEqual([21, 30, 30])
        t.q = 'page 1'
        await Promise.resolve()
        expect(t.total).toBe(11)
        expect(t.page).toBe(1)
    })
})
