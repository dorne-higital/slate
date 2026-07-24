// Hand-authored to match supabase/migrations/0001_init.sql.
// Regenerate against the live project once it exists:
//   yarn dlx supabase gen types typescript --project-id <ref> > layers/cms-core/types/database.types.ts
// and re-apply the `Database` export name if the CLI output differs.
//
// `Relationships` below is required by @supabase/postgrest-js's GenericTable
// type (missing it makes every query resolve to `never` instead of a real
// row type) and also drives type inference for nested `.select()` embeds
// like `site_members(profiles(...))` used in server/api/sites.

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string | null
                    full_name: string | null
                    is_platform_admin: boolean
                    created_at: string
                }
                Insert: {
                    id: string
                    email?: string | null
                    full_name?: string | null
                    is_platform_admin?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    email?: string | null
                    full_name?: string | null
                    is_platform_admin?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            sites: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    status: 'active' | 'paused' | 'archived'
                    custom_domain: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    status?: 'active' | 'paused' | 'archived'
                    custom_domain?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    status?: 'active' | 'paused' | 'archived'
                    custom_domain?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            site_members: {
                Row: {
                    site_id: string
                    user_id: string
                    role: 'owner' | 'admin' | 'editor' | 'viewer'
                    created_at: string
                }
                Insert: {
                    site_id: string
                    user_id: string
                    role?: 'owner' | 'admin' | 'editor' | 'viewer'
                    created_at?: string
                }
                Update: {
                    site_id?: string
                    user_id?: string
                    role?: 'owner' | 'admin' | 'editor' | 'viewer'
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'site_members_site_id_fkey'
                        columns: ['site_id']
                        isOneToOne: false
                        referencedRelation: 'sites'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'site_members_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
            pages: {
                Row: {
                    id: string
                    site_id: string
                    parent_id: string | null
                    title: string
                    slug: string
                    status: 'draft' | 'published'
                    seo_title: string | null
                    seo_description: string | null
                    blocks: unknown
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    site_id: string
                    parent_id?: string | null
                    title: string
                    slug: string
                    status?: 'draft' | 'published'
                    seo_title?: string | null
                    seo_description?: string | null
                    blocks?: unknown
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    site_id?: string
                    parent_id?: string | null
                    title?: string
                    slug?: string
                    status?: 'draft' | 'published'
                    seo_title?: string | null
                    seo_description?: string | null
                    blocks?: unknown
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'pages_site_id_fkey'
                        columns: ['site_id']
                        isOneToOne: false
                        referencedRelation: 'sites'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'pages_parent_id_fkey'
                        columns: ['parent_id']
                        isOneToOne: false
                        referencedRelation: 'pages'
                        referencedColumns: ['id']
                    }
                ]
            }
            component_registry: {
                Row: {
                    type: string
                    label: string
                    description: string | null
                    icon: string | null
                    schema: unknown
                    created_at: string
                }
                Insert: {
                    type: string
                    label: string
                    description?: string | null
                    icon?: string | null
                    schema?: unknown
                    created_at?: string
                }
                Update: {
                    type?: string
                    label?: string
                    description?: string | null
                    icon?: string | null
                    schema?: unknown
                    created_at?: string
                }
                Relationships: []
            }
            audit_log: {
                Row: {
                    id: string
                    site_id: string
                    actor_id: string | null
                    actor_email: string | null
                    action: 'insert' | 'update' | 'delete'
                    entity_type: string
                    entity_id: string
                    entity_label: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    site_id: string
                    actor_id?: string | null
                    actor_email?: string | null
                    action: 'insert' | 'update' | 'delete'
                    entity_type: string
                    entity_id: string
                    entity_label?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    site_id?: string
                    actor_id?: string | null
                    actor_email?: string | null
                    action?: 'insert' | 'update' | 'delete'
                    entity_type?: string
                    entity_id?: string
                    entity_label?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'audit_log_site_id_fkey'
                        columns: ['site_id']
                        isOneToOne: false
                        referencedRelation: 'sites'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'audit_log_actor_id_fkey'
                        columns: ['actor_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
            media: {
                Row: {
                    id: string
                    site_id: string
                    path: string
                    filename: string
                    mime_type: string
                    size_bytes: number
                    uploaded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    site_id: string
                    path: string
                    filename: string
                    mime_type: string
                    size_bytes: number
                    uploaded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    site_id?: string
                    path?: string
                    filename?: string
                    mime_type?: string
                    size_bytes?: number
                    uploaded_by?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'media_site_id_fkey'
                        columns: ['site_id']
                        isOneToOne: false
                        referencedRelation: 'sites'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'media_uploaded_by_fkey'
                        columns: ['uploaded_by']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    }
                ]
            }
        }
        Views: Record<string, never>
        Functions: {
            is_platform_admin: {
                Args: Record<string, never>
                Returns: boolean
            }
            has_site_role: {
                Args: { target_site_id: string, min_role: string }
                Returns: boolean
            }
            has_site_access: {
                Args: { target_site_id: string }
                Returns: boolean
            }
        }
        Enums: Record<string, never>
    }
}
