import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanUp, newAccount } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
beforeAll(async () => {
    ana = await newAccount('health')
})
afterAll(cleanUp)

const find = (r: { json: { checks: { key: string, ok: boolean, items?: { label: string, to?: string }[] }[] } }, key: string) => r.json.checks.find(c => c.key === key)!

describe('site health', () => {
    it('scores the site and spots a broken link', async () => {
        const first = await ana.client.get(`/api/sites/${ana.siteId}/health`)
        expect(first.status).toBe(200)
        expect(first.json.score).toBeGreaterThan(0)
        expect(first.json.score).toBeLessThanOrEqual(100)
        expect(find(first, 'domain').ok).toBe(false)

        const pages = await ana.client.get(`/api/sites/${ana.siteId}/pages`)
        const home = pages.json.find((p: { path: string }) => p.path === '/')
        const base = `/api/sites/${ana.siteId}/pages/${home.id}`
        await ana.client.patch(base, { blocks: [{ id: crypto.randomUUID(), type: 'hero', props: { heading: 'Hi', buttonLabel: 'Go', buttonUrl: '/nowhere-at-all' } }] })
        await ana.client.post(`${base}/publish`)

        const after = await ana.client.get(`/api/sites/${ana.siteId}/health`)
        const links = find(after, 'links')
        expect(links.ok).toBe(false)
        expect(links.items![0].label).toBe('/nowhere-at-all')
        expect(links.items![0].to).toMatch(/^\/pages\/.+\?block=/)
        expect(after.json.checks[0].ok).toBe(false)

        // A redirect from that address fixes it
        await ana.client.post(`/api/sites/${ana.siteId}/redirects`, { from: '/nowhere-at-all', to: '/' })
        expect(find(await ana.client.get(`/api/sites/${ana.siteId}/health`), 'links').ok).toBe(true)
    })
})
