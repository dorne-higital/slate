import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client, cleanUp, newAccount } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let ben: Awaited<ReturnType<typeof newAccount>>
beforeAll(async () => {
    ana = await newAccount('ana')
    ben = await newAccount('ben')
})
afterAll(cleanUp)

describe('signing up and in', () => {
    it('refuses sign-up without a bot check', async () => {
        const r = await new Client().post('/api/signup', { name: 'x', email: 'test+nobot@example.com', password: 'correct-horse-battery', siteName: 'x', layout: 'blank', turnstile: '' })
        expect(r.status).toBeGreaterThanOrEqual(400)
    })
    it('refuses throwaway email addresses', async () => {
        const r = await new Client().post('/api/signup', { name: 'x', email: `x${Date.now()}@mailinator.com`, password: 'correct-horse-battery', siteName: 'x', layout: 'blank', turnstile: 'XXXX.DUMMY.TOKEN.XXXX' })
        expect(r.status).toBe(400)
    })
    it('knows who you are once signed up', async () => {
        const r = await ana.client.get('/api/me')
        expect(r.status).toBe(200)
        expect(r.json.email).toBe(ana.email)
        expect(r.json.sites.map((s: { id: string }) => s.id)).toContain(ana.siteId)
    })
    it('asks strangers to log in', async () => {
        expect((await new Client().get('/api/me')).status).toBe(401)
        expect((await new Client().get(`/api/sites/${ana.siteId}`)).status).toBe(401)
    })
})

describe('keeping sites apart', () => {
    const routes = ['', '/pages', '/media', '/forms', '/menus', '/projects', '/billing', '/stats', '/people', '/support']
    it('answers 404 for every part of someone else’s site', async () => {
        for (const r of routes) expect((await ben.client.get(`/api/sites/${ana.siteId}${r}`)).status, r).toBe(404)
    })
    it('won’t let someone else change it', async () => {
        expect((await ben.client.put(`/api/sites/${ana.siteId}/theme`, { primary: '#000000' })).status).toBe(404)
        expect((await ben.client.post(`/api/sites/${ana.siteId}/projects`, { title: 'Hijack' })).status).toBe(404)
        expect((await ben.client.del(`/api/sites/${ana.siteId}`)).status).toBe(404)
    })
    it('blocks changes sent from another website', async () => {
        const r = await ana.client.req('PUT', `/api/sites/${ana.siteId}/theme`, { primary: '#000000' }, { origin: 'https://evil.example' })
        expect(r.status).toBe(403)
    })
})

describe('roles', () => {
    it('lets a viewer look but not edit', async () => {
        const invite = await ana.client.post(`/api/sites/${ana.siteId}/invites`, { role: 'viewer' })
        expect(invite.status).toBe(200)
        const token = String(invite.json.url).split('/').pop()
        expect((await ben.client.post(`/api/invites/${token}/accept`)).status).toBe(200)
        expect((await ben.client.get(`/api/sites/${ana.siteId}/pages`)).status).toBe(200)
        expect((await ben.client.post(`/api/sites/${ana.siteId}/projects`, { title: 'Nope' })).status).toBe(403)
        expect((await ben.client.put(`/api/sites/${ana.siteId}/theme`, { primary: '#000000' })).status).toBe(403)
    })
})

describe('platform admin routes', () => {
    it('hide from everyone else', async () => {
        for (const p of ['/api/admin/sites', '/api/admin/errors', '/api/admin/backups', '/api/admin/billing/discounts', '/api/admin/billing/invoices']) {
            expect((await ana.client.get(p)).status, p).toBe(404)
        }
    })
})
