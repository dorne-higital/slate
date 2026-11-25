/**
 * Everything on a site's Integrations page.
 * - 'id': a public ID or link pasted from the owner's own account, kept in sites.integrations (sent to visitors)
 * - 'connection': needs a secret (webhook address or API key), kept server-side in sites.connections
 * - 'builtin': Slate does it for every site; some can be switched off
 * - 'link': lives elsewhere in the CMS (a block, the Domains page)
 * - 'soon': on the way
 */
export type IntegrationCategory = 'analytics' | 'search' | 'ads' | 'forms' | 'bookings' | 'contact' | 'apps'
export type IntegrationKind = 'id' | 'connection' | 'builtin' | 'link' | 'soon'

export const INTEGRATION_CATEGORIES: { key: IntegrationCategory, name: string }[] = [
    { key: 'analytics', name: 'Analytics' },
    { key: 'search', name: 'Search' },
    { key: 'ads', name: 'Advertising' },
    { key: 'forms', name: 'Forms and email' },
    { key: 'bookings', name: 'Bookings' },
    { key: 'contact', name: 'Contact' },
    { key: 'apps', name: 'Apps' }
]

export interface IntegrationField {
    label: string
    placeholder: string
    help: string
}

export interface CatalogueItem {
    id: string
    name: string
    category: IntegrationCategory
    kind: IntegrationKind
    /** One line on the card */
    desc: string
    /** Logo tile: short mark and colours */
    mark: string
    tile: string
    ink?: string
    /** For 'id' items */
    key?: keyof SiteIntegrations
    fields?: IntegrationField[]
    /** Needs visitors' consent before it runs (sets cookies or tracks across sites) */
    needsConsent?: boolean
    /** For 'connection' items */
    connection?: ConnectionKey
    /** For 'link' items: path inside the site's CMS */
    to?: string
    linkLabel?: string
    /** Longer explanation shown when the card is opened */
    about?: string
    /** Comes with every plan (otherwise Business and Studio) */
    everyPlan?: boolean
}

export const CATALOGUE: CatalogueItem[] = [
    // Analytics
    { id: 'stats', name: 'Visitor stats', category: 'analytics', kind: 'builtin', key: 'stats', desc: 'Built in: visits and top pages, no cookies', mark: 'S', tile: '#1f2a37', everyPlan: true,
        about: 'Slate counts visits to your site with Cloudflare Web Analytics. It uses no cookies and doesn’t identify anyone, so there’s no banner to show. You’ll see the numbers on your Overview page.' },
    { id: 'ga4', key: 'ga4', name: 'Google Analytics', category: 'analytics', kind: 'id', desc: 'See who visits and where they come from', mark: 'GA', tile: '#e37400', needsConsent: true, everyPlan: true,
        fields: [{ label: 'Measurement ID', placeholder: 'G-ABC123XYZ', help: 'In Google Analytics: Admin › Data streams › your site. It starts with G-.' }] },
    { id: 'plausible', key: 'plausible', name: 'Plausible', category: 'analytics', kind: 'id', desc: 'Simple, cookie-free visitor stats', mark: 'P', tile: '#5850ec', everyPlan: true,
        fields: [{ label: 'Site domain in Plausible', placeholder: 'yourbusiness.co.uk', help: 'The domain you added in your Plausible account.' }] },

    // Search
    { id: 'googleVerify', key: 'googleVerify', name: 'Google Search Console', category: 'search', kind: 'id', desc: 'Prove you own the site and see how it does in Google', mark: 'G', tile: '#4285f4', everyPlan: true,
        fields: [{ label: 'Verification code', placeholder: 'Paste the HTML tag or just the code', help: 'In Search Console: add a URL prefix property, choose “HTML tag”, copy it, paste it here, then press Verify there.' }] },
    { id: 'bingVerify', key: 'bingVerify', name: 'Bing Webmaster Tools', category: 'search', kind: 'id', desc: 'Prove you own the site to Bing (and DuckDuckGo)', mark: 'B', tile: '#00809d', everyPlan: true,
        fields: [{ label: 'Verification code', placeholder: 'Paste the meta tag or just the code', help: 'In Bing Webmaster Tools: Add site › HTML Meta Tag. Paste it here, then press Verify there.' }] },
    { id: 'indexnow', name: 'IndexNow', category: 'search', kind: 'builtin', desc: 'Built in: tells Bing the moment you publish', mark: 'IN', tile: '#0e7490', everyPlan: true,
        about: 'Whenever you publish a page or post, Slate tells Bing, Yandex and other IndexNow search engines straight away, so changes show up in search sooner. Google finds them through your sitemap. Nothing to set up.' },

    // Advertising
    { id: 'metaPixel', key: 'metaPixel', name: 'Meta Pixel', category: 'ads', kind: 'id', desc: 'Measure Facebook and Instagram ads', mark: 'M', tile: '#0866ff', needsConsent: true,
        fields: [{ label: 'Pixel ID', placeholder: '123456789012345', help: 'In Meta Events Manager: Data sources › your pixel. Numbers only.' }] },

    // Forms and email
    { id: 'webhook', connection: 'webhook', name: 'Webhook', category: 'forms', kind: 'connection', desc: 'Send every form reply to Zapier, Make or your own app', mark: '{ }', tile: '#334155',
        about: 'Each new form reply is sent as JSON to the address you give. In Zapier use “Webhooks by Zapier › Catch Hook”; in Make use “Custom webhook”.' },
    { id: 'slack', connection: 'slack', name: 'Slack', category: 'forms', kind: 'connection', desc: 'Post new form replies in a Slack channel', mark: 'S', tile: '#4a154b',
        about: 'In Slack, create an app with “Incoming Webhooks” turned on, add a webhook to the channel you want, and paste its address here.' },
    { id: 'discord', connection: 'discord', name: 'Discord', category: 'forms', kind: 'connection', desc: 'Post new form replies in a Discord channel', mark: 'D', tile: '#5865f2',
        about: 'In Discord: channel settings › Integrations › Webhooks › New webhook › Copy webhook URL, then paste it here.' },
    { id: 'mailchimp', connection: 'mailchimp', name: 'Mailchimp', category: 'forms', kind: 'connection', desc: 'Add people from a sign-up form to your audience', mark: 'MC', tile: '#ffe01b', ink: '#241c15',
        about: 'In Mailchimp: profile › Extras › API keys › Create a key. Then choose the audience and the form that adds people to it. Only use a form where people ask to hear from you.' },
    { id: 'brevo', connection: 'brevo', name: 'Brevo', category: 'forms', kind: 'connection', desc: 'Add people from a sign-up form to a Brevo list', mark: 'B', tile: '#0b996e',
        about: 'In Brevo: your name › SMTP & API › API keys › Generate a new API key. Then choose the list and the form that adds people to it. Only use a form where people ask to hear from you.' },
    { id: 'kit', name: 'Kit', category: 'forms', kind: 'soon', desc: 'Send sign-ups to your Kit account', mark: 'K', tile: '#fb6970' },

    // Bookings
    { id: 'calendly', key: 'calendly', name: 'Calendly', category: 'bookings', kind: 'id', desc: 'Let customers book a visit or call', mark: 'C', tile: '#006bff',
        fields: [{ label: 'Calendly link', placeholder: 'https://calendly.com/yourname/visit', help: 'Then add a Booking block to any page.' }] },
    { id: 'stripe', name: 'Stripe deposits', category: 'bookings', kind: 'soon', desc: 'Take deposits through your forms', mark: 'S', tile: '#635bff' },

    // Contact
    { id: 'whatsapp', key: 'whatsapp', name: 'WhatsApp', category: 'contact', kind: 'id', desc: 'A “Message us” button on every page', mark: 'W', tile: '#25d366', ink: '#073b1c', everyPlan: true,
        fields: [{ label: 'WhatsApp number', placeholder: '07700 900123', help: 'The number your WhatsApp (or WhatsApp Business) account uses. UK mobiles can start with 07.' }] },
    { id: 'maps', name: 'Google Maps', category: 'contact', kind: 'link', desc: 'Show where to find you with a Map block', mark: 'GM', tile: '#34a853', to: '/pages', linkLabel: 'Add a Map block', everyPlan: true,
        about: 'Add a Map block to any page and type your address. The map loads when a visitor presses “Show map”, so Google sets no cookies until they choose to see it.' },
    { id: 'emailForwarding', name: 'Email forwarding', category: 'contact', kind: 'link', desc: 'hello@yourdomain to your own inbox, free', mark: '@', tile: '#f38020', to: '/domains', linkLabel: 'Set up on Domains', everyPlan: true,
        about: 'For domains bought through Slate. Choose an address like hello@yourdomain and the inbox it should go to.' },

    // Apps
    { id: 'iosAppBanner', key: 'iosAppBanner', name: 'Smart App Banner', category: 'apps', kind: 'id', desc: 'iPhone visitors see “Open in the App Store”', mark: 'A', tile: '#0d96f6',
        fields: [{ label: 'App Store link or app ID', placeholder: 'https://apps.apple.com/gb/app/your-app/id123456789', help: 'Safari shows a banner at the top of your site that opens or downloads your app.' }] },
    { id: 'appleAppLinks', key: 'appleAppLinks', name: 'iOS universal links', category: 'apps', kind: 'id', desc: 'Links to your site open in your iPhone app', mark: '', tile: '#111827',
        fields: [{ label: 'App ID (Team ID and bundle ID)', placeholder: 'A1B2C3D4E5.com.yourbusiness.app', help: 'Slate serves /.well-known/apple-app-site-association for every page. Add applinks:yourdomain to the app’s Associated Domains.' }] },
    { id: 'androidAppLinks', key: 'androidAppLinks', name: 'Android app links', category: 'apps', kind: 'id', desc: 'Links to your site open in your Android app', mark: 'A', tile: '#3ddc84', ink: '#06301a',
        fields: [
            { label: 'Package name', placeholder: 'com.yourbusiness.app', help: 'The applicationId in your app’s build.gradle.' },
            { label: 'SHA-256 certificate fingerprint', placeholder: '14:6D:E9:83:…', help: 'In Play Console: Setup › App signing. Add more than one by separating them with spaces.' }
        ] }
]

/** The items that store a value in sites.integrations ('id', plus switchable built-ins). */
export const INTEGRATIONS = CATALOGUE.filter(i => i.key) as (CatalogueItem & { key: keyof SiteIntegrations })[]

const tag = (raw: string, name: string) => raw.match(new RegExp(`name=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))?.[1]
    ?? raw.match(new RegExp(`content=["']([^"']+)["'][^>]*name=["']${name}["']`, 'i'))?.[1]
    ?? raw

/** Normalises a UK or international phone number to WhatsApp's digits-only form. */
function whatsappNumber(raw: string) {
    let v = raw.replace(/[\s().-]/g, '')
    if (v.startsWith('+')) v = v.slice(1)
    else if (v.startsWith('00')) v = v.slice(2)
    else if (/^0\d{10}$/.test(v)) v = `44${v.slice(1)}`
    return v
}

/** SHA-256 fingerprints as AA:BB:… (32 pairs), whether pasted with colons or not. */
function fingerprint(raw: string) {
    const hex = raw.replace(/:/g, '').toUpperCase()
    return /^[0-9A-F]{64}$/.test(hex) ? hex.match(/../g)!.join(':') : null
}

/** Normalises one value, or returns null if it doesn't match the tool's format. Multi-field values arrive joined by spaces. */
export function cleanIntegrationValue(key: keyof SiteIntegrations, raw: unknown): string | null {
    let v = typeof raw === 'string' ? raw.trim() : ''
    switch (key) {
        case 'ga4':
            v = v.toUpperCase()
            return /^G-[A-Z0-9]{4,16}$/.test(v) ? v : null
        case 'plausible':
            v = v.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
            return /^(?!-)[a-z0-9-]{1,63}(\.[a-z0-9-]{1,63})+$/.test(v) ? v : null
        case 'metaPixel':
            return /^\d{8,20}$/.test(v) ? v : null
        case 'calendly':
            if (/^calendly\.com\//i.test(v)) v = `https://${v}`
            return /^https:\/\/calendly\.com\/[\w-]+(\/[\w-]+)?\/?$/.test(v) ? v : null
        case 'whatsapp':
            v = whatsappNumber(v)
            return /^[1-9]\d{7,14}$/.test(v) ? v : null
        case 'googleVerify':
            v = tag(v, 'google-site-verification').trim()
            return /^[\w-]{20,100}$/.test(v) ? v : null
        case 'bingVerify':
            v = tag(v, 'msvalidate.01').trim().toUpperCase()
            return /^[0-9A-F]{32}$/.test(v) ? v : null
        case 'iosAppBanner':
            v = v.match(/\bid(\d{6,12})\b/)?.[1] ?? v
            return /^\d{6,12}$/.test(v) ? v : null
        case 'appleAppLinks': {
            const m = v.match(/^([A-Za-z0-9]{10})\.([A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+)$/)
            return m ? `${m[1]!.toUpperCase()}.${m[2]}` : null
        }
        case 'androidAppLinks': {
            const [pkg, ...prints] = v.split(/[\s,]+/).filter(Boolean)
            if (!pkg || !/^[a-zA-Z]\w*(\.[a-zA-Z]\w*)+$/.test(pkg) || !prints.length || prints.length > 5) return null
            const clean = prints.map(fingerprint)
            return clean.every(Boolean) ? [pkg, ...clean].join(' ') : null
        }
        case 'stats':
            return v === 'off' ? 'off' : null
    }
    return null
}

/** The Android app links value split back into its parts. */
export function androidAppLinksParts(v?: string) {
    const [pkg = '', ...prints] = (v ?? '').split(' ')
    return { pkg, prints }
}

// ── Connections (secrets) ──

const URL_RULES: Record<'webhook' | 'slack' | 'discord', RegExp> = {
    webhook: /^https:\/\/[^\s/?#]+\.[^\s/?#]+(\/\S*)?$/,
    slack: /^https:\/\/hooks\.slack\.com\/(services|triggers|workflows)\/\S+$/,
    discord: /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/
}

/** Checks a webhook-style address for one connection; returns it trimmed, or null. */
export function cleanConnectionUrl(key: 'webhook' | 'slack' | 'discord', raw: unknown): string | null {
    const v = typeof raw === 'string' ? raw.trim() : ''
    if (v.length > 500 || !URL_RULES[key].test(v)) return null
    try {
        const host = new URL(v).hostname
        // No private addresses or bare IPs
        if (/^(localhost|.*\.local|.*\.internal|\d+\.\d+\.\d+\.\d+|\[.*\])$/i.test(host)) return null
    } catch {
        return null
    }
    return v
}

/** Shows enough of a secret to recognise it: the host and the last few characters. */
export function maskSecret(v: string) {
    try {
        const u = new URL(v)
        return `${u.hostname}/…${v.slice(-4)}`
    } catch {
        return `…${v.slice(-4)}`
    }
}
