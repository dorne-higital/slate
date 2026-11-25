import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BASE, Client, cleanUp, newAccount, sql } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let visitor: Client
beforeAll(async () => {
    ana = await newAccount('system-pages')
    const [s] = await sql`select slug from sites where id = ${ana.siteId}` as { slug: string }[]
    visitor = new Client(`${s!.slug}.${new URL(BASE).host}`)
})
afterAll(cleanUp)

describe('system pages', () => {
    it('gives every site a locked Page not found page', async () => {
        const list = await ana.client.get(`/api/sites/${ana.siteId}/pages?projects=1`)
        const nf = list.json.find((p: { kind: string }) => p.kind === 'system')
        expect(nf).toMatchObject({ path: '/_404', title: 'Page not found', status: 'published' })
        expect((await ana.client.get(`/api/sites/${ana.siteId}/pages`)).json.some((p: { kind: string }) => p.kind === 'system')).toBe(false)
        const del = await ana.client.req('DELETE', `/api/sites/${ana.siteId}/pages/${nf.id}`)
        expect(del.status).toBe(400)
    })

    it('shows it for addresses that don’t exist, but not at its own address', async () => {
        const missing = await visitor.get('/api/public/page?path=/no-such-page')
        expect(missing.status).toBe(200)
        expect(missing.json.notFound).toBe(true)
        expect(missing.json.page.noIndex).toBe(true)
        const direct = await visitor.get('/api/public/page?path=/_404')
        expect(direct.json.notFound).toBe(true)
        const html = await visitor.get('/no-such-page')
        expect(html.status).toBe(404)
        expect(html.text).toContain('We can’t find that page')
    })
})
