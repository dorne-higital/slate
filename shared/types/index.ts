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
    headingFont?: string
    bodyFont?: string
    corners?: 'square' | 'soft' | 'round'
}

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
    isPlatformAdmin: boolean
    sites: SiteSummary[]
}
