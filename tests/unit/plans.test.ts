import { describe, expect, it } from 'vitest'
import { findPlan, formatPence, limitsFor, PLANS, priceLookupKey } from '../../shared/utils/plans'
import { DOMAIN_PRICES } from '../../shared/utils/domainPrices'

describe('plans', () => {
    it('charges ten months for a year', () => {
        for (const p of PLANS) expect(p.yearly).toBe(p.monthly * 10)
    })
    it('names Stripe prices consistently', () => {
        expect(priceLookupKey('business', 'month')).toBe('slate_business_monthly')
        expect(priceLookupKey('studio', 'year')).toBe('slate_studio_yearly')
    })
    it('gives trials Business limits and expired plans Starter limits', () => {
        expect(limitsFor('trial', null)).toEqual(findPlan('business')!.limits)
        expect(limitsFor('expired', null)).toEqual(findPlan('starter')!.limits)
    })
    it('gives every plan a blog and no Slate branding', () => {
        for (const p of PLANS) {
            expect(p.limits.blog, p.key).toBe(true)
            expect(p.limits.slateBadge, p.key).toBe(false)
        }
    })
    it('gives Starter enough for a real small business site', () => {
        const l = findPlan('starter')!.limits
        expect(l.pagesPerSite).toBeGreaterThanOrEqual(15)
        expect(l.formsPerSite).toBeGreaterThanOrEqual(3)
        expect(l.peoplePerSite).toBeGreaterThanOrEqual(2)
        expect(l.integrations).toContain('calendly')
    })
    it('keeps each plan at least as generous as the one below', () => {
        for (let i = 1; i < PLANS.length; i++) {
            const [a, b] = [PLANS[i - 1]!.limits, PLANS[i]!.limits]
            for (const k of ['sites', 'pagesPerSite', 'formsPerSite', 'peoplePerSite', 'storageBytes'] as const) expect(b[k], `${PLANS[i]!.key} ${k}`).toBeGreaterThanOrEqual(a[k])
        }
    })
    it('formats pence', () => {
        expect(formatPence(900)).toBe('£9')
        expect(formatPence(29550)).toBe('£295.50')
    })
    it('prices every domain ending above zero', () => {
        for (const [ending, pence] of Object.entries(DOMAIN_PRICES)) expect(pence, ending).toBeGreaterThan(0)
    })
})
