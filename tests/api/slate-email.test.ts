import { afterAll, describe, expect, it } from 'vitest'
import { Client, cleanUp, makeAdmin, newAccount } from './helpers'

afterAll(cleanUp)

describe('Slate’s own email (hello@slatecms.co.uk)', () => {
    it('is hidden from everyone but platform admins', async () => {
        const ana = await newAccount('slate-email-user')
        expect((await ana.client.get('/api/admin/slate-email')).status).toBe(404)
        expect((await ana.client.post('/api/admin/slate-email', {})).status).toBe(404)
        expect((await new Client().get('/api/admin/slate-email')).status).toBe(401)
    })

    it('reports its state without ever showing the private inbox', async () => {
        const admin = await newAccount('slate-email-admin')
        await makeAdmin(admin.userId)
        const r = await admin.client.get('/api/admin/slate-email')
        expect(r.status).toBe(200)
        expect(r.json).toHaveProperty('ready')
        expect(r.json).toHaveProperty('receiving')
        expect(r.text).not.toMatch(/@(live|gmail|outlook|hotmail)\./)
    })
})
