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
    footerStyle?: 'simple' | 'columns'
    footerColour?: ThemeColourChoice
}

export type ThemeSize = 'small' | 'medium' | 'large' | 'huge'
export type TextCase = 'none' | 'uppercase' | 'capitalize'
/** A section background picked from the theme's own colours */
export type ThemeColourChoice = 'page' | 'soft' | 'dark' | 'primary' | 'accent'

export const SOCIAL_NETWORKS = ['facebook', 'instagram', 'x', 'linkedin', 'tiktok', 'youtube', 'pinterest', 'threads'] as const
export type SocialNetwork = typeof SOCIAL_NETWORKS[number]
export type SiteSocials = Partial<Record<SocialNetwork, string>>

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
}

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
