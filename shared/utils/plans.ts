export type PlanKey = 'starter' | 'business' | 'studio'
export type BillingInterval = 'month' | 'year'

export interface PlanLimits {
    sites: number
    pagesPerSite: number
    formsPerSite: number
    /** People on a site, counting unused invitations */
    peoplePerSite: number
    blog: boolean
    /** Integrations allowed; 'all' or a list of keys */
    integrations: 'all' | (keyof SiteIntegrations)[]
}

export interface PlanInfo {
    key: PlanKey
    name: string
    tagline: string
    /** Prices in pence */
    monthly: number
    yearly: number
    limits: PlanLimits
}

const UNLIMITED = Number.POSITIVE_INFINITY

export const PLANS: PlanInfo[] = [
    {
        key: 'starter', name: 'Starter', tagline: 'For a simple site', monthly: 900, yearly: 9000,
        limits: { sites: 1, pagesPerSite: 10, formsPerSite: 1, peoplePerSite: 1, blog: false, integrations: ['ga4', 'plausible'] }
    },
    {
        key: 'business', name: 'Business', tagline: 'Most small businesses pick this', monthly: 1900, yearly: 19000,
        limits: { sites: 1, pagesPerSite: UNLIMITED, formsPerSite: UNLIMITED, peoplePerSite: 3, blog: true, integrations: 'all' }
    },
    {
        key: 'studio', name: 'Studio', tagline: 'For designers and agencies', monthly: 3900, yearly: 39000,
        limits: { sites: 10, pagesPerSite: UNLIMITED, formsPerSite: UNLIMITED, peoplePerSite: UNLIMITED, blog: true, integrations: 'all' }
    }
]

export const TRIAL_DAYS = 14
/** What a free trial can do: everything in Business */
export const TRIAL_PLAN: PlanKey = 'business'

export const findPlan = (key: string | null | undefined) => PLANS.find(p => p.key === key) ?? null
export const priceLookupKey = (plan: PlanKey, interval: BillingInterval) => `slate_${plan}_${interval === 'month' ? 'monthly' : 'yearly'}`
export const formatPence = (p: number) => `£${(p / 100).toFixed(p % 100 ? 2 : 0)}`

/**
 * Where an account stands:
 *  comped   — no bill (Slate's own sites, platform admins, sites from before billing)
 *  trial    — inside the free trial
 *  active   — paying (includes past_due while Stripe retries the card)
 *  expired  — trial over or subscription ended: client sites are paused until a plan is chosen
 */
export type BillingStatus = 'comped' | 'trial' | 'active' | 'past_due' | 'expired'

export interface BillingSummary {
    status: BillingStatus
    plan: PlanKey | null
    interval: BillingInterval | null
    trialEndsAt: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    /** Limits in force now. Infinity is sent as null over JSON. */
    limits: PlanLimits
    payerName: string | null
    youPay: boolean
}

export function limitsFor(status: BillingStatus, plan: PlanKey | null): PlanLimits {
    if (status === 'comped') return findPlan('studio')!.limits
    if (status === 'trial') return findPlan(TRIAL_PLAN)!.limits
    return findPlan(plan)?.limits ?? findPlan('starter')!.limits
}

export const isUnlimited = (n: number | null) => n === null || n === UNLIMITED
export const integrationAllowed = (limits: PlanLimits, key: keyof SiteIntegrations) => limits.integrations === 'all' || limits.integrations.includes(key)
