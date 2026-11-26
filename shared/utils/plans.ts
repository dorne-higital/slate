export type PlanKey = 'starter' | 'business' | 'studio'
export type BillingInterval = 'month' | 'year'

export interface PlanLimits {
    /** Sites included in the price */
    sites: number
    pagesPerSite: number
    formsPerSite: number
    /** People on a site, counting unused invitations */
    peoplePerSite: number
    /** Uploaded images and files, across all the sites this person pays for */
    storageBytes: number
    blog: boolean
    /** Integrations allowed; 'all' or a list of keys */
    integrations: 'all' | (keyof SiteIntegrations)[]
    /** Shows a small "Made with Slate" link in the site's footer */
    slateBadge: boolean
    /** Extra sites beyond `sites` can be added for this much a month (pence); null = not available */
    extraSiteMonthly: number | null
    support: 'Email' | 'Priority'
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

const GB = 1024 ** 3

export const PLANS: PlanInfo[] = [
    {
        key: 'starter', name: 'Starter', tagline: 'Everything a small business site needs', monthly: 1500, yearly: 15000,
        limits: { sites: 1, pagesPerSite: 20, formsPerSite: 3, peoplePerSite: 2, storageBytes: 5 * GB, blog: true, integrations: ['ga4', 'plausible', 'whatsapp', 'calendly', 'googleVerify', 'bingVerify', 'stats'], slateBadge: false, extraSiteMonthly: null, support: 'Email' }
    },
    {
        key: 'business', name: 'Business', tagline: 'Most small businesses pick this', monthly: 2900, yearly: 29000,
        limits: { sites: 1, pagesPerSite: 100, formsPerSite: 20, peoplePerSite: 5, storageBytes: 25 * GB, blog: true, integrations: 'all', slateBadge: false, extraSiteMonthly: null, support: 'Priority' }
    },
    {
        key: 'studio', name: 'Studio', tagline: 'For designers and agencies', monthly: 4900, yearly: 49000,
        limits: { sites: 5, pagesPerSite: 100, formsPerSite: 20, peoplePerSite: 10, storageBytes: 50 * GB, blog: true, integrations: 'all', slateBadge: false, extraSiteMonthly: 600, support: 'Priority' }
    }
]

/** An extra Studio site: £6 a month, or 10× that a year on yearly plans (same deal as the plans) */
export const EXTRA_SITE_LOOKUP = (interval: BillingInterval) => `slate_extra_site_${interval === 'month' ? 'monthly' : 'yearly'}`
export const extraSitePrice = (interval: BillingInterval) => interval === 'month' ? 600 : 6000

/** Slate's own sites and platform admins: no bill, generous limits, no badge */
const COMPED: PlanLimits = { sites: 1000, pagesPerSite: 1000, formsPerSite: 100, peoplePerSite: 100, storageBytes: 100 * GB, blog: true, integrations: 'all', slateBadge: false, extraSiteMonthly: null, support: 'Priority' }

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
    /** Limits in force now */
    limits: PlanLimits
    payerName: string | null
    youPay: boolean
    /** A price agreed with Slate for this customer, used instead of the list price */
    specialPrice: { plan: PlanKey, interval: BillingInterval, amount: number } | null
}

export function limitsFor(status: BillingStatus, plan: PlanKey | null): PlanLimits {
    if (status === 'comped') return COMPED
    if (status === 'trial') return findPlan(TRIAL_PLAN)!.limits
    return findPlan(plan)?.limits ?? findPlan('starter')!.limits
}

export const formatGB = (bytes: number) => `${Math.round(bytes / GB)} GB`
export const integrationAllowed = (limits: PlanLimits, key: keyof SiteIntegrations) => limits.integrations === 'all' || limits.integrations.includes(key)
/** Webhooks, chat alerts and email lists come with the plans that include every integration. */
export const connectionsAllowed = (limits: PlanLimits) => limits.integrations === 'all'

/** The comparison rows shown on the home page and in Billing, all from the limits above. */
export function planRowsFor(): { label: string, values: string[] }[] {
    const n = (v: number, one: string, many: string) => v === 1 ? `1 ${one}` : `Up to ${v} ${many}`
    return [
        { label: 'Websites', values: PLANS.map(p => p.limits.extraSiteMonthly ? `${p.limits.sites}, then ${formatPence(p.limits.extraSiteMonthly)}/mo each` : '1') },
        { label: 'Pages per site', values: PLANS.map(p => `Up to ${p.limits.pagesPerSite}`) },
        { label: 'Forms and replies inbox', values: PLANS.map(p => n(p.limits.formsPerSite, 'form', 'forms')) },
        { label: 'People who can edit', values: PLANS.map(p => p.limits.peoplePerSite === 1 ? 'Just you' : `Up to ${p.limits.peoplePerSite} per site`) },
        { label: 'Images and files', values: PLANS.map(p => `${formatGB(p.limits.storageBytes)}${p.limits.sites > 1 ? ' shared' : ''}`) },
        { label: 'Your own domain', values: PLANS.map(p => p.limits.sites > 1 ? 'Yes, on every site' : 'Yes') },
        { label: 'Integrations', values: PLANS.map(p => p.limits.integrations === 'all' ? 'All' : 'Analytics, search, WhatsApp and Calendly') },
        { label: 'Support', values: PLANS.map(p => p.limits.support) }
    ]
}

/** Short feature list for one plan (Billing page cards). */
export function planFeatures(p: PlanInfo): string[] {
    const l = p.limits
    return [
        l.extraSiteMonthly ? `${l.sites} websites, extra ones ${formatPence(l.extraSiteMonthly)}/mo` : '1 website',
        `Up to ${l.pagesPerSite} pages per site`,
        l.formsPerSite === 1 ? '1 form' : `Up to ${l.formsPerSite} forms`,
        l.peoplePerSite === 1 ? 'Just you editing' : `Up to ${l.peoplePerSite} editors per site`,
        `${formatGB(l.storageBytes)} for images and files`,
        l.integrations === 'all' ? 'All integrations' : 'Analytics, search, WhatsApp and Calendly',
        `${l.support} support`
    ]
}
