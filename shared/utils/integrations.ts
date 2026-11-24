export interface IntegrationInfo {
    key: keyof SiteIntegrations
    name: string
    group: string
    desc: string
    label: string
    placeholder: string
    help: string
    /** Needs visitors' consent before it runs (sets cookies or tracks across sites) */
    needsConsent: boolean
}

export const INTEGRATIONS: IntegrationInfo[] = [
    { key: 'ga4', name: 'Google Analytics', group: 'Analytics', desc: 'See who visits and where they come from', label: 'Measurement ID', placeholder: 'G-ABC123XYZ', help: 'In Google Analytics: Admin › Data streams › your site. It starts with G-.', needsConsent: true },
    { key: 'plausible', name: 'Plausible', group: 'Analytics', desc: 'Simple, cookie-free visitor stats', label: 'Site domain in Plausible', placeholder: 'yourbusiness.co.uk', help: 'The domain you added in your Plausible account.', needsConsent: false },
    { key: 'metaPixel', name: 'Meta Pixel', group: 'Advertising', desc: 'Measure Facebook and Instagram ads', label: 'Pixel ID', placeholder: '123456789012345', help: 'In Meta Events Manager: Data sources › your pixel. Numbers only.', needsConsent: true },
    { key: 'calendly', name: 'Calendly', group: 'Bookings', desc: 'Let customers book a visit or call', label: 'Calendly link', placeholder: 'https://calendly.com/yourname/visit', help: 'Then add a Booking block to any page.', needsConsent: false }
]

export const COMING_SOON = [
    { name: 'Mailchimp', group: 'Email and marketing', desc: 'Add newsletter sign-ups to your audience' },
    { name: 'Kit', group: 'Email and marketing', desc: 'Send sign-ups to your Kit account' },
    { name: 'Stripe', group: 'Bookings', desc: 'Take deposits through your forms' }
]

const FORMATS: Record<keyof SiteIntegrations, RegExp> = {
    ga4: /^G-[A-Z0-9]{4,16}$/,
    plausible: /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/,
    metaPixel: /^\d{8,20}$/,
    calendly: /^https:\/\/calendly\.com\/[\w-]+(\/[\w-]+)?\/?$/
}

/** Normalises one value, or returns null if it doesn't match the tool's format. */
export function cleanIntegrationValue(key: keyof SiteIntegrations, raw: unknown): string | null {
    let v = typeof raw === 'string' ? raw.trim() : ''
    if (key === 'ga4') v = v.toUpperCase()
    if (key === 'plausible') v = v.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    if (key === 'calendly' && /^calendly\.com\//i.test(v)) v = `https://${v}`
    return FORMATS[key].test(v) ? v : null
}
