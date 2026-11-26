import { afterAll, describe, expect, it } from 'vitest'
import { Client, cleanUp, makeAdmin, newAccount, sql, TURNSTILE_TEST_TOKEN } from './helpers'

afterAll(cleanUp)

describe('admin marketing stats', () => {
    it('is hidden from everyone but platform admins', async () => {
        const ana = await newAccount('mkt-stats-user')
        expect((await ana.client.get('/api/admin/marketing')).status).toBe(404)
        expect((await new Client().get('/api/admin/marketing')).status).toBe(401)
    })

    it('saves where a sign-up came from and reports it', async () => {
        const c = new Client()
        const email = `mkt-src-${Date.now()}@example.com`
        const r = await c.post('/api/signup', {
            name: 'Test source', email, password: 'correct-horse-battery', siteName: `Test source ${Date.now()}`, layout: 'blank', country: 'GB', turnstile: TURNSTILE_TEST_TOKEN,
            source: { ref: 'www.google.co.uk', landing: '/websites-for/plumbers', at: new Date().toISOString(), junk: 'x' }
        })
        expect(r.status).toBe(200)
        const [row] = await sql`select id, signup_source from "user" where email = ${email}` as { id: string, signup_source: unknown }[]
        expect(row!.signup_source).toEqual({ ref: 'www.google.co.uk', landing: '/websites-for/plumbers', at: expect.any(String) })

        const admin = await newAccount('mkt-stats-admin')
        await makeAdmin(admin.userId)
        const res = await admin.client.get('/api/admin/marketing?days=7')
        expect(res.status).toBe(200)
        expect(res.json.days).toBe(7)
        expect(res.json.signups.sources.find((s: { label: string }) => s.label === 'Google')?.count).toBeGreaterThanOrEqual(1)
        expect(res.json.signups.landings.find((s: { path: string }) => s.path === '/websites-for/plumbers')?.count).toBeGreaterThanOrEqual(1)
        expect(res.json.signups.perDay).toHaveLength(7)
        expect(res.json.waitingList).toHaveProperty('total')
        expect(res.json.visitors).toHaveProperty('available')
        await sql`delete from sites where billing_user_id = ${row!.id}`
        await sql`delete from billing_accounts where user_id = ${row!.id}`
        await sql`delete from "user" where id = ${row!.id}`
    })
})
