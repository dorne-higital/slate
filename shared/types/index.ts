export type SiteRole = 'owner' | 'admin' | 'editor' | 'viewer'

export const ROLE_RANK: Record<SiteRole, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 }

export type PageStatus = 'draft' | 'published'

/** One block on a page. `type` maps to a component in app/components/blocks. */
export interface Block {
    id: string
    type: string
    props: Record<string, unknown>
}

/** A client site's look. Every field optional: unset means "use the default" (see shared/utils/siteTheme.ts). */
export interface SiteTheme {
    /** Buttons, links and highlights */
    primary?: string
    /** Headings and dark sections */
    dark?: string
    /** Light section backgrounds */
    soft?: string
    /** Paragraphs */
    text?: string
    /** Main background */
    background?: string
    /** Small highlights: labels, underlines, icons */
    accent?: string
    headingFont?: string
    bodyFont?: string
    /** Set by the server from the Google Fonts list when saved: the css2 family value and the kind (s, r, d, h, m) */
    headingFontCss?: string
    headingFontKind?: string
    bodyFontCss?: string
    bodyFontKind?: string
    corners?: 'square' | 'soft' | 'round'
    /** Dark swaps the page to the Dark colour with light text */
    scheme?: 'light' | 'dark'
    /** Media library or https image addresses */
    logo?: string
    /** Optional version of the logo for dark or coloured headers and footers (e.g. white lettering) */
    logoOnDark?: string
    /** A different image for the footer only (empty: the light logo on dark footers, else the main logo) */
    footerLogo?: string
    logoHeight?: number
    favicon?: string
    /** Big page headings (hero) and section headings */
    titleSize?: ThemeSize
    headingSize?: ThemeSize
    navSize?: 'small' | 'medium' | 'large'
    headingCase?: TextCase
    navCase?: TextCase
    buttonCase?: TextCase
    // ── Layout ──
    headerStyle?: 'standard' | 'centred' | 'mega'
    headerColour?: ThemeColourChoice
    headerSticky?: boolean
    /** Frosted glass: the header colour turns see-through and blurs the page behind it */
    headerGlass?: boolean
    headerSocials?: boolean
    /** normal: above the page · overlay: see-through on top of the first section · hidden: no header at all */
    headerMode?: 'normal' | 'overlay' | 'hidden'
    /** Overlay only: light text for dark or coloured top sections, dark text for light ones */
    headerOverlayText?: 'light' | 'dark'
    footerStyle?: 'simple' | 'columns'
    footerColour?: ThemeColourChoice
}

export type ThemeSize = 'small' | 'medium' | 'large' | 'huge'
export type TextCase = 'none' | 'uppercase' | 'capitalize'
/** A section background picked from the theme's own colours */
export type ThemeColourChoice = 'page' | 'soft' | 'dark' | 'primary' | 'accent'

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'x', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'threads'] as const
export type SocialNetwork = typeof SOCIAL_NETWORKS[number]
/** App store links, kept with the social links but never shown as footer icons. Used by the showcase blocks. */
export const APP_STORES = ['appStore', 'googlePlay'] as const
export type AppStore = typeof APP_STORES[number]
export type SiteSocials = Partial<Record<SocialNetwork | AppStore, string>>

/** Site-wide search and sharing defaults. */
export interface SiteSeo {
    /** Added after every page title, e.g. " | Bramble & Oak, Bristol". Empty means the site name. */
    titleSuffix?: string
    /** Used when a page has no description of its own */
    defaultDescription?: string
    /** Used when a page has no share image of its own */
    defaultShareImage?: string
}

/** Third-party tools connected to a site. Each value is validated against the tool's format. */
export interface SiteIntegrations {
    /** Google Analytics 4 measurement ID, e.g. G-ABC123XYZ */
    ga4?: string
    /** The domain as registered in Plausible, e.g. brambleandoak.co.uk */
    plausible?: string
    /** Meta (Facebook) Pixel ID: digits only */
    metaPixel?: string
    /** Calendly scheduling link, e.g. https://calendly.com/bramble/visit */
    calendly?: string
    /** WhatsApp number in international form, digits only, e.g. 447700900123 */
    whatsapp?: string
    /** Google Search Console verification code (the content of its meta tag) */
    googleVerify?: string
    /** Bing Webmaster Tools verification code (msvalidate.01) */
    bingVerify?: string
    /** App Store app ID (digits) for Safari's Smart App Banner */
    iosAppBanner?: string
    /** Apple app ID for universal links: Team ID + bundle ID, e.g. A1B2C3D4E5.com.example.app */
    appleAppLinks?: string
    /** Android app links: package name, a space, then SHA-256 certificate fingerprints separated by spaces */
    androidAppLinks?: string
    /** 'off' when the owner has switched off Slate's built-in visitor stats */
    stats?: string
}

/**
 * Tools that need a secret (webhook addresses, API keys). Server-only: never sent to visitors,
 * and the CMS only ever sees the masked view (SiteConnectionsView).
 */
export interface SiteConnections {
    webhook?: ConnectionBase & { url: string }
    slack?: ConnectionBase & { url: string }
    discord?: ConnectionBase & { url: string }
    mailchimp?: ConnectionBase & { apiKey: string, listId: string, listName: string, formId: string }
    brevo?: ConnectionBase & { apiKey: string, listId: string, listName: string, formId: string }
}
export type ConnectionKey = keyof SiteConnections
export interface ConnectionBase {
    /** Last failed send, so the owner can see something's wrong */
    lastError?: string
    lastErrorAt?: string
    lastOkAt?: string
}
/** What the CMS sees of one connection: enough to recognise it, never the secret. */
export interface ConnectionView {
    hint: string
    listName?: string
    formId?: string
    lastError?: string
    lastErrorAt?: string
    lastOkAt?: string
}
export type SiteConnectionsView = Partial<Record<ConnectionKey, ConnectionView>>

export type MenuSlot = 'header' | 'footer' | 'legal'

export interface MenuItem {
    id: string
    label: string
    /** A page path like /services, or a full web address, mailto: or tel: link */
    url: string
    /** 1 = shown in a dropdown under the item above it (header only) */
    depth: 0 | 1
    button?: boolean
    newTab?: boolean
}

export interface SiteSummary {
    id: string
    name: string
    slug: string
    customDomain: string | null
    role: SiteRole
}

export interface PageListItem {
    id: string
    parentId: string | null
    title: string
    path: string
    status: PageStatus
    hasUnpublishedChanges: boolean
    updatedAt: string
    updatedByName: string | null
    /** Projects (/work/…) and system pages (404…) are only included when asked for (?projects=1, the Pages screen) */
    kind?: 'page' | 'project' | 'system'
}

export interface Me {
    id: string
    name: string
    email: string
    emailVerified: boolean
    isPlatformAdmin: boolean
    sites: SiteSummary[]
}

/** A project as shown on cards (Projects block, project pages) */
export interface ProjectCard {
    title: string
    path: string
    category: string
    summary: string
    cover: string
    coverAlt: string
    year: string
    featured: boolean
}

/** Extra details a page has when it's a project (pages.kind = 'project') */
export interface ProjectMeta {
    category?: string
    summary?: string
    cover?: string
    coverAlt?: string
    year?: string
    featured?: boolean
    /** Shown beside the cover: Built 2025, Platform iPhone… */
    details?: { label: string, value: string }[]
    /** Buttons under the details: Visit live site, App Store… */
    links?: { label: string, url: string }[]
}
