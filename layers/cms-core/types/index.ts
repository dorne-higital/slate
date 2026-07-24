export type SiteRole = 'owner' | 'admin' | 'editor' | 'viewer'

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    is_platform_admin: boolean
    created_at: string
}

export interface Site {
    id: string
    name: string
    slug: string
    status: 'active' | 'paused' | 'archived'
    custom_domain: string | null
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
