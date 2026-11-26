/** The areas of the help centre (slatecms.co.uk/help), in display order, and which CMS screens each covers. */
export type HelpArea = 'getting-started' | 'pages' | 'look' | 'blog' | 'forms' | 'media' | 'domains' | 'search' | 'integrations' | 'people' | 'account'

export interface HelpAreaInfo {
    key: HelpArea
    name: string
    blurb: string
    /** Line icon key (SHOWCASE_ICONS) */
    icon: string
    /** CMS screens (the part after /sites/<id>/) this area explains */
    screens: string[]
}

// Kept last: Nuxt's auto-import scanner drops exports that follow an exported array literal
export const HELP_AREAS: HelpAreaInfo[] = [
    { key: 'getting-started', name: 'Getting started', blurb: 'Your first site, the dashboard and publishing', icon: 'star', screens: ['overview'] },
    { key: 'pages', name: 'Pages and blocks', blurb: 'Adding pages, building them from blocks, history', icon: 'chart', screens: ['pages', 'editor', 'blocks'] },
    { key: 'look', name: 'Look and layout', blurb: 'Colours, fonts, logo, header, footer and menus', icon: 'heart', screens: ['theme', 'layout', 'menus'] },
    { key: 'blog', name: 'Blog and projects', blurb: 'Writing posts and showing your work', icon: 'calendar', screens: ['blog', 'projects'] },
    { key: 'forms', name: 'Forms', blurb: 'Contact and quote forms, and the replies inbox', icon: 'chat', screens: ['forms'] },
    { key: 'media', name: 'Pictures and files', blurb: 'Uploading and describing images', icon: 'camera', screens: ['media'] },
    { key: 'domains', name: 'Domains and email', blurb: 'Buying or connecting a domain, email forwarding', icon: 'globe', screens: ['domains'] },
    { key: 'search', name: 'Google and site health', blurb: 'Getting found, share images and redirects', icon: 'tick', screens: ['seo'] },
    { key: 'integrations', name: 'Integrations', blurb: 'Analytics, WhatsApp, booking and more', icon: 'bolt', screens: ['integrations'] },
    { key: 'people', name: 'People', blurb: 'Letting others help edit your site', icon: 'people', screens: ['people'] },
    { key: 'account', name: 'Account and billing', blurb: 'Plans, taking your site offline, your data', icon: 'lock', screens: ['billing', 'settings', 'support'] }
]
