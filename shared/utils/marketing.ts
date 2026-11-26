/**
 * Every page of Slate's own marketing site, in one place. The header, footer, sitemap and each
 * page's SEO tags all read from here, so a page's title and description are only ever written once.
 */
export type MarketingSection = 'home' | 'features' | 'for' | 'pricing' | 'compare' | 'guides' | 'company' | 'legal'

export interface MarketingPage {
    path: string
    /** <title>: at most 60 characters */
    title: string
    /** Meta description: 120 to 160 characters */
    description: string
    h1: string
    section: MarketingSection
    /** Short name for menus and breadcrumbs */
    navLabel?: string
    /** Share image, 1200×630, under /og/ */
    image: string
}

const page = (p: Omit<MarketingPage, 'image'> & { image?: string }): MarketingPage => ({
    ...p,
    image: p.image ?? `/og/${p.path === '/' ? 'home' : p.path.slice(1).replace(/\//g, '-')}.png`
})

export const MARKETING_SITE = 'https://slatecms.co.uk'

export function marketingPage(path: string): MarketingPage {
    const found = MARKETING_PAGES.find(p => p.path === path)
    if (!found) throw new Error(`No marketing page for ${path}`)
    return found
}

export interface FaqItem { q: string, a: string }

/** FAQPage structured data, so Google can show the questions under the result. */
export function faqJsonLd(items: FaqItem[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } }))
    }
}

export const marketingSections = (section: MarketingSection) => MARKETING_PAGES.filter(p => p.section === section)

// Kept last: Nuxt's auto-import scanner drops exports that follow an exported array literal
export const MARKETING_PAGES: MarketingPage[] = [
    page({
        path: '/', section: 'home', navLabel: 'Home',
        title: 'Slate: website builder for UK small businesses',
        description: 'Build your business website from ready-made blocks, then run it all in one place: domain, email, forms, blog and SEO. Made in the UK. 14-day free trial.',
        h1: 'Your business website, built and run from one place'
    }),

    page({
        path: '/features', section: 'features', navLabel: 'All features',
        title: 'Features: everything your website needs | Slate',
        description: 'The page editor, domains and email forwarding, forms with an inbox, SEO tools and a site health check, plus integrations. See everything Slate includes.',
        h1: 'Everything your website needs, already included'
    }),
    page({
        path: '/features/editor', section: 'features', navLabel: 'Editor and blocks',
        title: 'Page editor and blocks: build pages by clicking | Slate',
        description: 'Build pages from ready-made blocks: heroes, services, galleries, prices and contact forms. Set your colours once, preview on a phone and undo any publish.',
        h1: 'Build pages by putting blocks in order'
    }),
    page({
        path: '/features/domains-and-email', section: 'features', navLabel: 'Domains and email',
        title: 'Buy a domain or connect yours, with email | Slate',
        description: 'Search for and buy a .co.uk or .com inside Slate, or connect one you own. Free email forwarding from hello@yourbusiness to your inbox, and HTTPS set up for you.',
        h1: 'Your own domain and email address, sorted for you'
    }),
    page({
        path: '/features/forms', section: 'features', navLabel: 'Forms and inbox',
        title: 'Contact forms with an inbox and spam protection | Slate',
        description: 'Add contact, quote and booking forms to any page. Every reply lands in your inbox and your email, with spam blocked, and can go straight to Slack or Mailchimp.',
        h1: 'Forms that bring in work, and an inbox to keep track'
    }),
    page({
        path: '/features/seo', section: 'features', navLabel: 'SEO and site health',
        title: 'SEO tools and a site health check built in | Slate',
        description: 'Slate shows what to fix to get found on Google: page descriptions, share images, broken links, redirects and big pictures, each with a link straight to the fix.',
        h1: 'Get found on Google without learning SEO'
    }),
    page({
        path: '/features/integrations', section: 'features', navLabel: 'Integrations',
        title: 'Integrations: analytics, booking, chat and more | Slate',
        description: 'Connect Google Analytics, Search Console, Calendly, WhatsApp, Mailchimp, Slack and more by pasting one code. No plugins to install and nothing to keep updated.',
        h1: 'Connect the tools you already use'
    }),

    page({
        path: '/for/trades', section: 'for', navLabel: 'Trades',
        title: 'Websites for plumbers, electricians and builders | Slate',
        description: 'A website that wins quote requests: your services, areas you cover, photos of your work and a quote form that lands in your inbox. Live in an afternoon.',
        h1: 'A website that brings in quote requests for your trade'
    }),
    page({
        path: '/for/salons-and-clinics', section: 'for', navLabel: 'Salons and clinics',
        title: 'Websites for salons, therapists and clinics | Slate',
        description: 'A calm, professional site for your salon or clinic: treatments and prices, your team, online booking through Calendly or Fresha, and a privacy page.',
        h1: 'A website that fills your appointment book'
    }),
    page({
        path: '/for/shops-and-cafes', section: 'for', navLabel: 'Shops and cafés',
        title: 'Websites for local shops, cafés and bakeries | Slate',
        description: 'A website for your shop or café: opening hours, what’s on the menu, a map and directions, news on the blog and a WhatsApp button so customers can just ask.',
        h1: 'A website that brings people through your door'
    }),
    page({
        path: '/for/clubs-and-charities', section: 'for', navLabel: 'Clubs and charities',
        title: 'Websites for clubs, charities and community groups | Slate',
        description: 'A website for your club, charity or group: fixtures and events, news, how to join or volunteer, a sign-up form and a login for each person who edits.',
        h1: 'A website your whole committee can keep up to date'
    }),
    page({
        path: '/for/freelancers-and-studios', section: 'for', navLabel: 'Freelancers and studios',
        title: 'Build client websites on Slate: for studios | Slate',
        description: 'Build and run websites for your clients from one login. Hand over editing safely, connect their domains, and stop looking after plugins and hosting.',
        h1: 'Build client sites without looking after servers'
    }),

    page({
        path: '/pricing', section: 'pricing', navLabel: 'Pricing',
        title: 'Pricing: simple monthly plans, no setup fee | Slate',
        description: 'Simple monthly or yearly plans with hosting, HTTPS, forms and support included. Try it free for 14 days with no card needed, and cancel any time.',
        h1: 'Simple pricing with everything included'
    }),

    page({
        path: '/compare/wix', section: 'compare', navLabel: 'Slate vs Wix',
        title: 'Slate vs Wix: an honest comparison for UK businesses',
        description: 'How Slate and Wix compare on price, ease of use, domains, email, forms and SEO for a UK small business, with sources and the date we checked each fact.',
        h1: 'Slate and Wix, compared honestly'
    }),
    page({
        path: '/compare/squarespace', section: 'compare', navLabel: 'Slate vs Squarespace',
        title: 'Slate vs Squarespace: an honest comparison',
        description: 'How Slate and Squarespace compare on price, design, domains, email, forms and SEO for a UK small business, with sources and the date we checked each fact.',
        h1: 'Slate and Squarespace, compared honestly'
    }),
    page({
        path: '/compare/wordpress', section: 'compare', navLabel: 'Slate vs WordPress',
        title: 'Slate vs WordPress: which suits a small business?',
        description: 'WordPress can do almost anything, but needs hosting, plugins and updates. See how it compares with Slate on cost, upkeep, security and ease of use.',
        h1: 'Slate and WordPress, compared honestly'
    }),

    page({
        path: '/guides', section: 'guides', navLabel: 'Guides',
        title: 'Guides: running a small business website | Slate',
        description: 'Plain-English guides to getting your business on Google, what to put on your website, moving from Wix, and the website rules UK small businesses need to follow.',
        h1: 'Guides for running your website'
    }),

    page({
        path: '/about', section: 'company', navLabel: 'About',
        title: 'About Slate: a UK website builder made in Warrington',
        description: 'Slate is built and run in Warrington by Dan Horne, a web developer who wants small businesses to run their own website without paying an agency.',
        h1: 'Why Slate exists'
    }),
    page({
        path: '/contact', section: 'company', navLabel: 'Contact',
        title: 'Contact Slate: questions, help and sales',
        description: 'A question about Slate, moving your site or building sites for clients? Send a message and you’ll hear back from a real person, usually within a working day.',
        h1: 'Get in touch'
    }),

    page({
        path: '/privacy', section: 'legal', navLabel: 'Privacy',
        title: 'Privacy policy | Slate',
        description: 'How Slate collects, uses and protects personal information for account holders and for visitors to sites built with Slate, under UK GDPR and the DPA 2018.',
        h1: 'Privacy policy'
    }),
    page({
        path: '/terms', section: 'legal', navLabel: 'Terms',
        title: 'Terms of service | Slate',
        description: 'The terms for using Slate: your account, plans and payments, free trials, cancelling, what you can publish, your content, and who is responsible for what.',
        h1: 'Terms of service'
    })
]
