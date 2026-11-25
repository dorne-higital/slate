import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BASE, Client, cleanUp, newAccount, sql } from './helpers'

let ana: Awaited<ReturnType<typeof newAccount>>
let slug = ''
const SLACK = 'https://hooks.slack.com/services/T0TEST/B0TEST/SecretPart9876'
const FP = '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5'

beforeAll(async () => {
    ana = await newAccount('integrations')
    const [s] = await sql`select slug from sites where id = ${ana.siteId}` as { slug: string }[]
    slug = s!.slug
})
afterAll(cleanUp)

describe('connections (secrets)', () => {
    it('saves a Slack webhook but only ever shows the end of it', async () => {
        const bad = await ana.client.put(`/api/sites/${ana.siteId}/connections`, { key: 'slack', url: 'https://example.com/hook' })
        expect(bad.status).toBe(400)
        const r = await ana.client.put(`/api/sites/${ana.siteId}/connections`, { key: 'slack', url: SLACK })
        expect(r.status).toBe(200)
        expect(r.text).not.toContain('SecretPart')
        expect(r.json.slack.hint).toBe('hooks.slack.com/…9876')
        const list = await ana.client.get(`/api/sites/${ana.siteId}/connections`)
        expect(list.text).not.toContain('SecretPart')
        expect(list.json.allowed).toBe(true)
    })

    it('never sends them to visitors or other people', async () => {
        const site = await ana.client.get(`/api/sites/${ana.siteId}`)
        expect(site.text).not.toContain('SecretPart')
        const visitor = new Client(`${slug}.${new URL(BASE).host}`)
        const page = await visitor.get('/api/public/page?path=/')
        expect(page.text).not.toContain('SecretPart')
        const stranger = await newAccount('integrations-stranger')
        expect((await stranger.client.get(`/api/sites/${ana.siteId}/connections`)).status).toBe(404)
    })

    it('rejects a wrong email list key without saving', async () => {
        const r = await ana.client.post(`/api/sites/${ana.siteId}/connections/lists`, { key: 'mailchimp', apiKey: 'not-a-key' })
        expect(r.status).toBe(400)
        expect(r.json.statusMessage).toContain('Mailchimp')
    })

    it('disconnects', async () => {
        const r = await ana.client.put(`/api/sites/${ana.siteId}/connections`, { key: 'slack', remove: true })
        expect(r.json).toEqual({})
    })
})

describe('site integrations', () => {
    it('puts verification tags and the WhatsApp number in place', async () => {
        for (const [key, value] of [['whatsapp', '07700 900123'], ['googleVerify', 'abcDEF123_-xyz456ghiJKL789mno'], ['iosAppBanner', 'https://apps.apple.com/gb/app/x/id6741234567']]) {
            const r = await ana.client.put(`/api/sites/${ana.siteId}/integrations`, { key, value })
            expect(r.status).toBe(200)
        }
        const r = await ana.client.put(`/api/sites/${ana.siteId}/integrations`, { key: 'whatsapp', value: 'nope' })
        expect(r.status).toBe(400)
        const [s] = await sql`select integrations from sites where id = ${ana.siteId}` as { integrations: Record<string, string> }[]
        expect(s!.integrations).toMatchObject({ whatsapp: '447700900123', iosAppBanner: '6741234567' })
    })

    it('serves app link files only when set', async () => {
        const visitor = new Client(`${slug}.${new URL(BASE).host}`)
        expect((await visitor.get('/.well-known/assetlinks.json')).status).toBe(404)
        await ana.client.put(`/api/sites/${ana.siteId}/integrations`, { key: 'androidAppLinks', value: `com.dobiedash.app ${FP}` })
        await ana.client.put(`/api/sites/${ana.siteId}/integrations`, { key: 'appleAppLinks', value: 'A1B2C3D4E5.com.dobiedash.app' })
        const android = await visitor.get('/.well-known/assetlinks.json')
        expect(android.json[0].target).toEqual({ namespace: 'android_app', package_name: 'com.dobiedash.app', sha256_cert_fingerprints: [FP] })
        const apple = await visitor.get('/.well-known/apple-app-site-association')
        expect(apple.json.applinks.details[0].appIDs).toEqual(['A1B2C3D4E5.com.dobiedash.app'])
    })

    it('serves an IndexNow key on each site', async () => {
        const visitor = new Client(`${slug}.${new URL(BASE).host}`)
        const r = await visitor.get('/indexnow-key.txt')
        expect(r.status).toBe(200)
        expect(r.text).toMatch(/^[0-9a-f]{32}$/)
    })
})
