import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cleanUp, makeAdmin, newAccount, sql } from './helpers'

// Test-mode (simulated) orders only: nothing here talks to name.com or Stripe
let ana: Awaited<ReturnType<typeof newAccount>>
let admin: Awaited<ReturnType<typeof newAccount>>
const ids: string[] = []
async function order(status: string, domain: string) {
    const [row] = await sql`insert into domain_orders (site_id, user_id, domain_name, price, status, simulated, error)
        values (${ana.siteId}, ${ana.userId}, ${domain}, 1500, ${status}, true, ${status === 'failed' ? 'Registration: test failure' : null}) returning id` as { id: string }[]
    ids.push(row!.id)
    return row!.id
}
beforeAll(async () => {
    ana = await newAccount('domains')
    admin = await newAccount('domains-admin')
    await makeAdmin(admin.userId)
})
afterAll(async () => {
    if (ids.length) await sql`delete from domain_orders where id = any(${ids})`
    await cleanUp()
})

describe('failed domain orders', () => {
    it('lists them for platform admins only, failed first', async () => {
        await order('active', `ok-${Date.now()}.com`)
        const failed = await order('failed', `broken-${Date.now()}.com`)
        expect((await ana.client.get('/api/admin/domains')).status).toBe(404)
        const list = await admin.client.get('/api/admin/domains')
        expect(list.status).toBe(200)
        expect(list.json[0].status).toBe('failed')
        expect(list.json.find((o: { id: string }) => o.id === failed).error).toContain('test failure')
    })

    it('retries a failed order and refuses one that isn’t failed', async () => {
        const failed = await order('failed', `retry-${Date.now()}.com`)
        expect((await ana.client.post(`/api/admin/domains/${failed}/retry`)).status).toBe(404)
        const r = await admin.client.post(`/api/admin/domains/${failed}/retry`)
        expect(r.status).toBe(200)
        expect(r.json.status).toBe('active')
        expect((await admin.client.post(`/api/admin/domains/${failed}/retry`)).status).toBe(409)
    })

    it('marks a failed order as done by hand', async () => {
        const failed = await order('failed', `byhand-${Date.now()}.com`)
        expect((await admin.client.post(`/api/admin/domains/${failed}/done`)).status).toBe(200)
        const [row] = await sql`select status, error from domain_orders where id = ${failed}` as { status: string, error: string | null }[]
        expect(row).toEqual({ status: 'active', error: null })
    })
})

describe('moving a domain away', () => {
    it('gives the owner a transfer answer for active orders only', async () => {
        const active = await order('active', `move-${Date.now()}.com`)
        const failed = await order('failed', `stuck-${Date.now()}.com`)
        const r = await ana.client.post(`/api/sites/${ana.siteId}/domains/orders/${active}/transfer`)
        expect(r.status).toBe(200)
        expect(r.json.kind).toBe('test')
        expect((await ana.client.post(`/api/sites/${ana.siteId}/domains/orders/${failed}/transfer`)).status).toBe(409)
        // Someone else's site: not found
        expect((await admin.client.post(`/api/sites/${admin.siteId}/domains/orders/${active}/transfer`)).status).toBe(404)
    })
})
