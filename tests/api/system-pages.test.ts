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
        const nf = list.json.find((p: { path: string }) => p.path === '/_404')
        expect(list.json.filter((p: { kind: string }) => p.kind === 'system').map((p: { path: string }) => p.path).sort()).toEqual(['/_404', '/_offline'])
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

describe('offline page', () => {
    it('shows the Offline page on every address while the site is offline, with a 503', async () => {
        await ana.client.get(`/api/sites/${ana.siteId}/pages?projects=1`)
        await sql`update sites set offline = true where id = ${ana.siteId}`
        try {
            const page = await visitor.get('/api/public/page?path=/about')
            expect(page.status).toBe(200)
            expect(page.json.offline).toBe(true)
            expect(page.json.page.blocks[0].props.heading).toBe('We’re making a few changes')
            const html = await visitor.get('/anything')
            expect(html.status).toBe(503)
            expect(html.text).toContain('We’re making a few changes')
            expect((await visitor.get('/blog')).status).toBe(302)
            expect((await visitor.get('/api/public/blog')).status).toBe(503)
        } finally {
            await sql`update sites set offline = false where id = ${ana.siteId}`
        }
    })

    it('falls back to the plain holding page if the Offline page is unpublished', async () => {
        await sql`update pages set status = 'draft' where site_id = ${ana.siteId} and path = '/_offline'`
        await sql`update sites set offline = true where id = ${ana.siteId}`
        try {
            const html = await visitor.get('/')
            expect(html.status).toBe(503)
            expect(html.text).toContain('taking a short break')
        } finally {
            await sql`update sites set offline = false where id = ${ana.siteId}`
        }
    })
})
