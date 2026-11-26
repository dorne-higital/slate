import { DOMAIN_PRICES } from './domainPrices'
import { PLANS, TRIAL_DAYS, formatPence } from './plans'

/**
 * Comparison pages. Every fact about another product comes from its own website, with the date
 * it was checked and a link, so readers can check it themselves. Prices change: re-check before editing.
 */
export type RivalSlug = 'wix' | 'squarespace' | 'wordpress'

export interface Rival {
    slug: RivalSlug
    name: string
    /** The rival's own domains: sources must be on one of these */
    domains: string[]
    checked: '26 Nov 2026'
    intro: string
    sources: { label: string, url: string }[]
    rows: { topic: string, slate: string, rival: string }[]
    fit: { slate: string[], rival: string[] }
}

export const rival = (slug: string) => RIVALS.find(r => r.slug === slug)

// Slate's side of each row, from shared/utils/plans.ts where it's a number
const slatePrice = () => `${PLANS.map(p => `${p.name} ${formatPence(p.monthly)}`).join(', ')} a month, or ten times that a year (two months free)`

// Kept last: Nuxt's auto-import scanner drops exports that follow an exported array literal
export const RIVALS: Rival[] = [
    {
        slug: 'wix',
        name: 'Wix',
        domains: ['wix.com'],
        checked: '26 Nov 2026',
        intro: 'Wix is one of the biggest website builders in the world, with a huge choice of templates, apps and design freedom. Slate is smaller and more focused: a UK website builder for small businesses that want a good site without the choices getting in the way.',
        sources: [
            { label: 'Wix: which premium plan to pick', url: 'https://www.wix.com/blog/wix-premium-plans' },
            { label: 'Wix plans and pricing', url: 'https://www.wix.com/plans' }
        ],
        rows: [
            { topic: 'Price', slate: slatePrice(), rival: 'Light £9, Core £16, Business £25 and Business Elite £119 a month, as shown on Wix’s UK plans page' },
            { topic: 'Free plan', slate: `No, but a ${TRIAL_DAYS}-day free trial with everything included`, rival: 'Yes, £0, without your own domain' },
            { topic: 'Domain', slate: `Buy one from ${formatPence(Math.min(...Object.values(DOMAIN_PRICES)))} a year, or connect yours free`, rival: 'Free for the first year on paid plans' },
            { topic: 'Taking payments', slate: 'Not built in: Slate is for showing your business and bringing in enquiries', rival: 'Core plan and above' },
            { topic: 'Design', slate: 'Ready-made blocks that follow your colours and fonts, so pages stay consistent', rival: 'Drag anything anywhere on the page, with hundreds of templates' },
            { topic: 'Add-ons', slate: 'Integrations by pasting a code; nothing to install', rival: 'A large app market, some of it paid' },
            { topic: 'Where it’s from', slate: 'Built and supported in the UK, data stored in London', rival: 'A large international company' },
            { topic: 'VAT', slate: 'Not VAT registered, so no VAT is added', rival: 'Check Wix’s checkout for tax' }
        ],
        fit: {
            slate: ['You want a clean, professional site without designing every pixel', 'You’d rather have fewer choices and a site that’s hard to break', 'UK-based support and data matter to you'],
            rival: ['You want complete freedom over every element of the design', 'You need a full online shop or many specialist apps', 'You want the widest choice of templates']
        }
    },
    {
        slug: 'squarespace',
        name: 'Squarespace',
        domains: ['squarespace.com'],
        checked: '26 Nov 2026',
        intro: 'Squarespace is known for beautiful templates, especially for photographers, creatives and shops. Slate is built for UK small businesses that mostly need enquiries, quotes and bookings, with the running of the site taken care of.',
        sources: [{ label: 'Squarespace pricing', url: 'https://www.squarespace.com/pricing' }],
        rows: [
            { topic: 'Price', slate: slatePrice(), rival: 'Four plans, Basic to Advanced, from £12 to £89 a month depending on plan and how you pay' },
            { topic: 'Free trial', slate: `${TRIAL_DAYS} days, no card needed`, rival: '14 days, no card needed' },
            { topic: 'Domain', slate: `Buy one from ${formatPence(Math.min(...Object.values(DOMAIN_PRICES)))} a year, or connect yours free`, rival: 'Free for the first year on annual plans, then the standard rate' },
            { topic: 'Email', slate: 'Free forwarding to your existing inbox on domains bought through Slate', rival: 'A year of Google Workspace on Core and above; extra after that' },
            { topic: 'Cancelling', slate: 'Any time; your site stays up until the end of the paid period', rival: 'Any time; the service runs until the end of the paid period' },
            { topic: 'Where it’s from', slate: 'Built and supported in the UK, data stored in London', rival: 'A large international company' }
        ],
        fit: {
            slate: ['Your site’s main job is bringing in enquiries, quotes or bookings', 'You want forms, an inbox and a site health check without extra set-up', 'You’d rather forward email to the inbox you already use'],
            rival: ['Design and photography are at the heart of your business', 'You want to sell products, courses or memberships online', 'You want Google Workspace email included for a year']
        }
    },
    {
        slug: 'wordpress',
        name: 'WordPress',
        domains: ['wordpress.com', 'wordpress.org'],
        checked: '26 Nov 2026',
        intro: 'WordPress runs a huge share of the web and can do almost anything. The free software from WordPress.org needs hosting, plugins and regular updates; WordPress.com runs it for you. Slate is a simpler choice for small businesses that want a site without becoming its caretaker.',
        sources: [
            { label: 'WordPress.com pricing', url: 'https://wordpress.com/pricing/' },
            { label: 'WordPress.org: hosting', url: 'https://wordpress.org/hosting/' }
        ],
        rows: [
            { topic: 'Price', slate: slatePrice(), rival: 'WordPress.org software is free, but you pay for hosting and often for themes and plugins. WordPress.com plans are from US$4 a month billed yearly, plus tax' },
            { topic: 'Updates', slate: 'Nothing to update; Slate looks after the platform', rival: 'Self-hosted sites need WordPress, themes and plugins kept up to date' },
            { topic: 'Security', slate: 'No plugins to exploit; HTTPS on every address', rival: 'Depends on your host and keeping plugins updated' },
            { topic: 'Flexibility', slate: 'A focused set of blocks and integrations', rival: 'Almost unlimited, with thousands of plugins and themes' },
            { topic: 'Forms and SEO', slate: 'Built in: forms with an inbox, SEO tools and a site health check', rival: 'Usually added with plugins' },
            { topic: 'Support', slate: 'Ask from inside Slate, answered by a person in the UK', rival: 'Depends on your host or plan; community forums for WordPress.org' }
        ],
        fit: {
            slate: ['You want a site that doesn’t need maintaining', 'You don’t want to choose and look after plugins', 'You’d like one bill and one place to ask for help'],
            rival: ['You need something very custom, like a membership site or complex shop', 'You have a developer, or are one', 'You want to own and host every part of the software yourself']
        }
    }
]
