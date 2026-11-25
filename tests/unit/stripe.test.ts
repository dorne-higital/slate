import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyStripeSignature } from '../../server/utils/stripe'

const secret = 'whsec_test_secret'
const sign = (payload: string, t: number, key = secret) => `t=${t},v1=${createHmac('sha256', key).update(`${t}.${payload}`).digest('hex')}`

describe('Stripe webhook signatures', () => {
    const payload = '{"type":"customer.subscription.updated"}'
    const now = Math.floor(Date.now() / 1000)
    it('accepts a correct, fresh signature', async () => {
        expect(await verifyStripeSignature(payload, sign(payload, now), secret)).toBe(true)
    })
    it('rejects a wrong secret, a changed body, an old timestamp or no header', async () => {
        expect(await verifyStripeSignature(payload, sign(payload, now, 'whsec_other'), secret)).toBe(false)
        expect(await verifyStripeSignature(`${payload} `, sign(payload, now), secret)).toBe(false)
        expect(await verifyStripeSignature(payload, sign(payload, now - 600), secret)).toBe(false)
        expect(await verifyStripeSignature(payload, undefined, secret)).toBe(false)
        expect(await verifyStripeSignature(payload, sign(payload, now), '')).toBe(false)
    })
})
