import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BASE, Client, cleanUp, newAccount, sql } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let visitor: Client
beforeAll(async () => {
    ana = await newAccount('redirects')
    const [s] = await sql`select slug from sites where id = ${ana.siteId}` as { slug: string }[]
    visitor = new Client(`${s!.slug}.${new URL(BASE).host}`)
})
afterAll(cleanUp)

describe('redirects', () => {
    it('adds one, refuses bad ones, and sends visitors on with a 301', async () => {
        const r = await ana.client.post(`/api/sites/${ana.siteId}/redirects`, { from: 'https://oldsite.co.uk/About-Us/', to: '/' })
        expect(r.status).toBe(200)
        expect((await ana.client.post(`/api/sites/${ana.siteId}/redirects`, { from: '/', to: '/x' })).status).toBe(400)
        expect((await ana.client.post(`/api/sites/${ana.siteId}/redirects`, { from: '/x', to: 'javascript:alert(1)' })).status).toBe(400)

        const res = await visitor.req('GET', '/about-us')
        expect(res.status).toBe(301)
        const [row] = await sql`select hits from redirects where site_id = ${ana.siteId}` as { hits: number }[]
        expect(row!.hits).toBeGreaterThanOrEqual(1)
    })

    it('takes a pasted list and says which lines it skipped', async () => {
        const r = await ana.client.post(`/api/sites/${ana.siteId}/redirects`, { items: [{ from: '/a', to: '/b' }, { from: '/', to: '/c' }, { from: '/blog/old-post', to: 'https://example.com/new' }] })
        expect(r.json.added).toBe(2)
        expect(r.json.skipped).toHaveLength(1)
        expect(r.json.skipped[0].line).toBe(2)
        const post = await visitor.req('GET', '/blog/old-post')
        expect(post.status).toBe(301)
    })

    it('only lets people on the site see and change them', async () => {
        const list = await ana.client.get(`/api/sites/${ana.siteId}/redirects`)
        expect(list.json.length).toBe(3)
        const stranger = await newAccount('redirects-stranger')
        expect((await stranger.client.get(`/api/sites/${ana.siteId}/redirects`)).status).toBe(404)
        expect((await stranger.client.req('DELETE', `/api/sites/${ana.siteId}/redirects/${list.json[0].id}`)).status).toBe(404)
        expect((await ana.client.req('DELETE', `/api/sites/${ana.siteId}/redirects/${list.json[0].id}`)).status).toBe(200)
    })
})
