import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { Client, cleanUp, makeAdmin, newAccount, sql } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let admin: Awaited<ReturnType<typeof newAccount>>
beforeAll(async () => {
    ana = await newAccount('support')
    admin = await newAccount('support-admin')
    await makeAdmin(admin.userId)
})
afterAll(cleanUp)

describe('support tickets', () => {
    const bug = { subject: 'Contact form won’t send', category: 'bug', severity: 'p2', answers: { where: '/contact', did: 'Filled it in and pressed Send', expected: 'A thank-you message', happened: 'Nothing', device: 'Safari on a Mac' }, body: 'Started today' }
    it('needs a severity and the required answers for a bug', async () => {
        expect((await ana.client.post(`/api/sites/${ana.siteId}/support`, { ...bug, severity: undefined })).json.statusMessage).toMatch(/how bad/)
        const missing = await ana.client.post(`/api/sites/${ana.siteId}/support`, { ...bug, answers: { ...bug.answers, happened: '' } })
        expect(missing.status).toBe(400)
        expect(missing.json.statusMessage).toMatch(/What happened instead/)
        expect((await ana.client.post(`/api/sites/${ana.siteId}/support`, { ...bug, answers: { ...bug.answers, device: 'A toaster' } })).status).toBe(400)
    })
    let ticketId = ''
    it('files a bug with its answers in the first message', async () => {
        const r = await ana.client.post(`/api/sites/${ana.siteId}/support`, bug)
        expect(r.status).toBe(200)
        ticketId = r.json.id
        expect(r.json.category).toBe('bug')
        expect(r.json.severity).toBe('p2')
        const first = r.json.messages[0].body as string
        expect(first).toContain('Type: Something’s broken (P2, important)')
        expect(first).toContain('Filled it in and pressed Send')
        expect(first).toContain('Started today')
    })
    it('drops severity on anything that isn’t a bug', async () => {
        const r = await ana.client.post(`/api/sites/${ana.siteId}/support`, { subject: 'Price list block', category: 'feature', severity: 'p1', answers: { what: 'Tabs of prices', why: 'Services page' } })
        expect(r.status).toBe(200)
        expect(r.json.severity).toBeNull()
    })
    it('lists urgent open bugs first in the helpdesk and lets admins re-file', async () => {
        await ana.client.post(`/api/sites/${ana.siteId}/support`, { ...bug, subject: 'Site is down', severity: 'p1' })
        const list = await admin.client.get('/api/admin/support?status=open')
        const mine = list.json.filter((t: { siteId: string }) => t.siteId === ana.siteId)
        expect(mine[0].severity).toBe('p1')
        expect((await ana.client.patch(`/api/admin/support/${ticketId}`, { severity: 'p1' })).status).toBe(404)
        const moved = await admin.client.patch(`/api/admin/support/${ticketId}`, { category: 'help' })
        expect(moved.json.category).toBe('help')
        expect(moved.json.severity).toBeNull()
    })
    it('flags urgent problems in Needs your attention', async () => {
        const ov = await admin.client.get('/api/admin/overview')
        const kinds = ov.json.attention.map((a: { kind: string }) => a.kind)
        expect(kinds).toContain('p1')
        expect(kinds).toContain('support')
        expect(ov.json.attention.find((a: { kind: string }) => a.kind === 'p1').link).toBe('/admin/support')
    })
})

afterAll(async () => {
    await sql`delete from support_tickets where site_id = ${ana.siteId}`
})

describe('register interest', () => {
    const email = `test+interest${Date.now()}@example.com`
    it('takes an email once, quietly ignores repeats and bots', async () => {
        const c = new Client()
        expect((await c.post('/api/public/interest', { email: 'nope', turnstile: 'XXXX.DUMMY.TOKEN.XXXX' })).status).toBe(400)
        expect((await c.post('/api/public/interest', { email, name: 'Jo', turnstile: 'XXXX.DUMMY.TOKEN.XXXX' })).status).toBe(200)
        expect((await c.post('/api/public/interest', { email, turnstile: 'XXXX.DUMMY.TOKEN.XXXX' })).status).toBe(200)
        expect((await c.post('/api/public/interest', { email: `bot${email}`, website: 'spam', turnstile: 'XXXX.DUMMY.TOKEN.XXXX' })).status).toBe(200)
        const rows = await sql`select email from interest_signups where email like ${'%' + email}`
        expect(rows.map(r => r.email)).toEqual([email])
    })
    it('lists only for platform admins, with a CSV', async () => {
        expect((await ana.client.get('/api/admin/interest')).status).toBe(404)
        const list = await admin.client.get('/api/admin/interest')
        expect(list.json.some((r: { email: string }) => r.email === email)).toBe(true)
        expect((await admin.client.get('/api/admin/interest?format=csv')).text).toContain(email)
    })
    afterAll(async () => { await sql`delete from interest_signups where email like ${'%' + email}` })
})
