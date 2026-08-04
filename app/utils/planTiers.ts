export interface PlanTier {
    key: 'free' | 'pro' | 'business'
    name: string
    tagline: string
    priceMonthly: string
    priceAnnual: string
}

/** Shared between the homepage pricing section and /register's plan picker so the two never drift apart. */
export const PLAN_TIERS: PlanTier[] = [
    { key: 'free', name: 'Free', tagline: 'Try Slate on one site.', priceMonthly: '£0', priceAnnual: '£0' },
    { key: 'pro', name: 'Pro', tagline: 'For a site that outgrew the basics.', priceMonthly: '£15', priceAnnual: '£12' },
    { key: 'business', name: 'Business', tagline: 'For a site your whole team runs.', priceMonthly: '£39', priceAnnual: '£31' }
]
