export type SiteRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    is_platform_admin: boolean
    created_at: string
}

/**
 * A site's full design-token customization — colors, radius, shadows,
 * typography, and spacing. Every field is optional — an unset field (or
 * a null/absent `theme` altogether) means "use the built-in default,"
 * not "use an empty/invalid value." See utils/siteTheme.ts for the
 * canonical field list, CSS variable names, grouping, and defaults.
 */
export interface SiteTheme {
    bgPrimary?: string
    bgSecondary?: string

    textPrimary?: string
    textSecondary?: string
    textInverse?: string

    brandPrimary?: string
    brandSecondary?: string
    brandAccent?: string

    success?: string
    successBg?: string
    error?: string
    errorBg?: string
    warning?: string
    warningBg?: string
    info?: string
    infoBg?: string

    link?: string
    linkHover?: string

    border?: string
    borderStrong?: string

    buttonPrimaryBg?: string
    buttonPrimaryText?: string
    buttonPrimaryHoverBg?: string

    buttonSecondaryBg?: string
    buttonSecondaryText?: string
    buttonSecondaryBorder?: string
    buttonSecondaryHoverBg?: string

    buttonTertiaryText?: string
    buttonTertiaryHoverBg?: string

    buttonOutlineText?: string
    buttonOutlineBorder?: string
    buttonOutlineHoverBg?: string

    borderRadiusSm?: string
    borderRadiusMd?: string
    borderRadiusLg?: string
    borderRadiusPill?: string

    shadowSm?: string
    shadowMd?: string
    shadowLg?: string

    headingFontFamily?: string
    bodyFontFamily?: string

    heroSize?: string
    h1Size?: string
    h2Size?: string
    h3Size?: string
    h4Size?: string
    h5Size?: string
    h6Size?: string
    eyebrowSize?: string
    buttonSize?: string
    navigationSize?: string
    bodySize?: string

    headingFontWeight?: string
    buttonFontWeight?: string
    navigationFontWeight?: string
    bodyFontWeight?: string

    paddingXs?: string
    paddingSm?: string
    paddingMd?: string
    paddingLg?: string
    paddingXl?: string
}

export interface Site {
    id: string
    name: string
    slug: string
    status: 'active' | 'paused' | 'archived'
    custom_domain: string | null
    theme: SiteTheme | null
    created_at: string
    updated_at: string
}

export interface SiteMember {
    site_id: string
    user_id: string
    role: SiteRole
    created_at: string
}

export interface SiteWithMembers extends Site {
    site_members: Array<Pick<SiteMember, 'user_id' | 'role'> & { profiles: Pick<Profile, 'email' | 'full_name'> | null }>
}

/** A single block instance stored inside `pages.blocks`. */
export interface Block {
    id: string
    type: string
    props: Record<string, unknown>
}

export type PageStatus = 'draft' | 'published'

export interface Page {
    id: string
    site_id: string
    parent_id: string | null
    title: string
    slug: string
    status: PageStatus
    seo_title: string | null
    seo_description: string | null
    blocks: Block[]
    created_at: string
    updated_at: string
}

export interface PageTreeNode extends Page {
    children: PageTreeNode[]
}

export type BlockFieldKind =
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'image'
    | 'url'
    | 'select'
    | 'boolean'
    | 'number'

export interface BlockFieldSchema {
    key: string
    label: string
    kind: BlockFieldKind
    default?: unknown
    options?: Array<{ label: string, value: string }>
    required?: boolean
}

/** A row from `component_registry` — defines an editable block type. */
export interface ComponentDefinition {
    type: string
    label: string
    description: string | null
    icon: string | null
    schema: BlockFieldSchema[]
    created_at: string
}

export type AuditAction = 'insert' | 'update' | 'delete'

/** A row from `audit_log` — written only by SECURITY DEFINER triggers, never by clients directly. */
export interface AuditLogEntry {
    id: string
    site_id: string
    actor_id: string | null
    actor_email: string | null
    action: AuditAction
    entity_type: string
    entity_id: string
    entity_label: string | null
    created_at: string
}

export interface SiteDashboardStats {
    pages: number
    publishedPages: number
    draftPages: number
    members: number
}

/** A row from `media`, plus the public URL derived from its storage path. */
export interface MediaItem {
    id: string
    site_id: string
    path: string
    filename: string
    mime_type: string
    size_bytes: number
    uploaded_by: string | null
    created_at: string
    url: string
}
