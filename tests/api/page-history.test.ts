import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanUp, newAccount } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let pageId = ''
const hero = (heading: string) => [{ id: crypto.randomUUID(), type: 'hero', props: { heading } }]
beforeAll(async () => {
    ana = await newAccount('history')
    const pages = await ana.client.get(`/api/sites/${ana.siteId}/pages`)
    pageId = pages.json.find((p: { path: string }) => p.path === '/').id
})
afterAll(cleanUp)

describe('page history', () => {
    it('keeps a copy each publish and restores one as the draft', async () => {
        const base = `/api/sites/${ana.siteId}/pages/${pageId}`
        await ana.client.req('PATCH', base, { blocks: hero('First version') })
        await ana.client.post(`${base}/publish`)
        await ana.client.post(`${base}/publish`) // nothing changed: no new copy
        await ana.client.req('PATCH', base, { blocks: hero('Second version') })
        await ana.client.post(`${base}/publish`)

        const list = await ana.client.get(`${base}/versions`)
        expect(list.status).toBe(200)
        const mine = list.json.filter((v: { summary: string }) => /version/.test(v.summary))
        expect(mine.map((v: { summary: string }) => v.summary)).toEqual(['Second version', 'First version'])
        expect(list.json[0].live).toBe(true)

        const restored = await ana.client.post(`${base}/versions/${mine[1].id}`)
        expect(restored.status).toBe(200)
        expect(restored.json.blocks[0].props.heading).toBe('First version')
        expect(restored.json.hasUnpublishedChanges).toBe(true)
    })

    it('keeps other people out', async () => {
        const stranger = await newAccount('history-stranger')
        expect((await stranger.client.get(`/api/sites/${ana.siteId}/pages/${pageId}/versions`)).status).toBe(404)
    })
})
