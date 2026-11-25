import { describe, expect, it } from 'vitest'
import { CATALOGUE, INTEGRATIONS, androidAppLinksParts, cleanConnectionUrl, cleanIntegrationValue, maskSecret } from '../../shared/utils/integrations'
import { PLANS, connectionsAllowed, integrationAllowed } from '../../shared/utils/plans'

const FP = '14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5'

describe('cleanIntegrationValue', () => {
    it('turns UK and international numbers into WhatsApp form', () => {
        expect(cleanIntegrationValue('whatsapp', '07700 900123')).toBe('447700900123')
        expect(cleanIntegrationValue('whatsapp', '+44 (0)7700-900123'.replace('(0)', ''))).toBe('447700900123')
        expect(cleanIntegrationValue('whatsapp', '0044 7700 900123')).toBe('447700900123')
        expect(cleanIntegrationValue('whatsapp', 'call me')).toBeNull()
    })

    it('takes search verification codes from the full meta tag or on their own', () => {
        expect(cleanIntegrationValue('googleVerify', '<meta name="google-site-verification" content="abcDEF123_-xyz456ghiJKL789mno" />')).toBe('abcDEF123_-xyz456ghiJKL789mno')
        expect(cleanIntegrationValue('googleVerify', 'abcDEF123_-xyz456ghiJKL789mno')).toBe('abcDEF123_-xyz456ghiJKL789mno')
        expect(cleanIntegrationValue('googleVerify', '"><script>')).toBeNull()
        expect(cleanIntegrationValue('bingVerify', '<meta name="msvalidate.01" content="0123456789abcdef0123456789abcdef" />')).toBe('0123456789ABCDEF0123456789ABCDEF')
        expect(cleanIntegrationValue('bingVerify', 'nope')).toBeNull()
    })

    it('finds the app ID in an App Store link', () => {
        expect(cleanIntegrationValue('iosAppBanner', 'https://apps.apple.com/gb/app/dobie-dash/id6741234567')).toBe('6741234567')
        expect(cleanIntegrationValue('iosAppBanner', '6741234567')).toBe('6741234567')
        expect(cleanIntegrationValue('iosAppBanner', 'https://example.com')).toBeNull()
    })

    it('checks app link details', () => {
        expect(cleanIntegrationValue('appleAppLinks', 'a1b2c3d4e5.com.dobiedash.app')).toBe('A1B2C3D4E5.com.dobiedash.app')
        expect(cleanIntegrationValue('appleAppLinks', 'com.dobiedash.app')).toBeNull()
        const android = cleanIntegrationValue('androidAppLinks', `com.dobiedash.app ${FP.replace(/:/g, '').toLowerCase()}`)
        expect(android).toBe(`com.dobiedash.app ${FP}`)
        expect(androidAppLinksParts(android!)).toEqual({ pkg: 'com.dobiedash.app', prints: [FP] })
        expect(cleanIntegrationValue('androidAppLinks', 'com.dobiedash.app')).toBeNull()
        expect(cleanIntegrationValue('androidAppLinks', 'com.dobiedash.app AB:CD')).toBeNull()
    })

    it('only lets stats be switched off', () => {
        expect(cleanIntegrationValue('stats', 'off')).toBe('off')
        expect(cleanIntegrationValue('stats', 'on')).toBeNull()
    })

    it('has a cleaner for every stored integration', () => {
        for (const i of INTEGRATIONS) expect(cleanIntegrationValue(i.key, '')).toBeNull()
        expect(new Set(CATALOGUE.map(i => i.id)).size).toBe(CATALOGUE.length)
    })
})

describe('connections', () => {
    it('only accepts the right kind of webhook address', () => {
        expect(cleanConnectionUrl('slack', 'https://hooks.slack.com/services/T000/B000/XXXX')).toBeTruthy()
        expect(cleanConnectionUrl('slack', 'https://evil.example/services/x')).toBeNull()
        expect(cleanConnectionUrl('discord', 'https://discord.com/api/webhooks/123/abc-DEF')).toBeTruthy()
        expect(cleanConnectionUrl('webhook', 'https://hooks.zapier.com/hooks/catch/1/abc/')).toBeTruthy()
        expect(cleanConnectionUrl('webhook', 'http://hooks.zapier.com/x')).toBeNull()
        expect(cleanConnectionUrl('webhook', 'https://127.0.0.1/x')).toBeNull()
        expect(cleanConnectionUrl('webhook', 'https://localhost/x')).toBeNull()
    })

    it('masks secrets', () => {
        expect(maskSecret('https://hooks.slack.com/services/T000/B000/XXXX1234')).toBe('hooks.slack.com/…1234')
        expect(maskSecret(`${'ab'.repeat(16)}-zz9`)).toBe('…-zz9')
    })

    it('come with Business and Studio; Starter gets WhatsApp and search', () => {
        const [starter, business] = PLANS
        expect(connectionsAllowed(starter!.limits)).toBe(false)
        expect(connectionsAllowed(business!.limits)).toBe(true)
        expect(integrationAllowed(starter!.limits, 'whatsapp')).toBe(true)
        expect(integrationAllowed(starter!.limits, 'metaPixel')).toBe(false)
    })
})
