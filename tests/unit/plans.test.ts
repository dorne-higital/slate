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
    it('keeps Starter’s Slate badge and drops it on paid-up plans', () => {
        expect(findPlan('starter')!.limits.slateBadge).toBe(true)
        expect(findPlan('business')!.limits.slateBadge).toBe(false)
    })
    it('formats pence', () => {
        expect(formatPence(900)).toBe('£9')
        expect(formatPence(29550)).toBe('£295.50')
    })
    it('prices every domain ending above zero', () => {
        for (const [ending, pence] of Object.entries(DOMAIN_PRICES)) expect(pence, ending).toBeGreaterThan(0)
    })
})
