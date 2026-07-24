import type { H3Event } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '../../types/database.types'
import type { SiteRole } from '../../types'

export interface SiteAccessContext {
    client: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>
    isPlatformAdmin: boolean
    role: SiteRole
    userId: string
}

/**
 * Second line of defense on top of Postgres RLS, not a replacement for it —
 * this calls the same is_platform_admin()/has_site_role() SQL functions the
 * RLS policies use, through the request's own RLS-scoped Supabase client, so
 * the app-layer check and the database-layer check can never drift apart.
 *
 * Every Nitro route under server/api that touches a specific site must call
 * this before making any other Supabase call.
 */
export async function requireSiteAccess(
    event: H3Event,
    siteId: string,
    minRole: SiteRole = 'viewer'
): Promise<SiteAccessContext> {
    if (!siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const client = await serverSupabaseClient<Database>(event)

    const { data: isPlatformAdmin, error: adminError } = await client.rpc('is_platform_admin')

    if (adminError) {
        throw createError({ statusCode: 500, statusMessage: 'Could not resolve platform admin status' })
    }

    if (isPlatformAdmin) {
        return { client, isPlatformAdmin: true, role: 'owner', userId: user.id }
    }

    const { data: hasAccess, error: accessError } = await client.rpc('has_site_role', {
        target_site_id: siteId,
        min_role: minRole
    })

    if (accessError) {
        throw createError({ statusCode: 500, statusMessage: 'Could not resolve site access' })
    }

    if (!hasAccess) {
        throw createError({ statusCode: 403, statusMessage: 'You do not have access to this site' })
    }

    const { data: membership } = await client
        .from('site_members')
        .select('role')
        .eq('site_id', siteId)
        .eq('user_id', user.id)
        .maybeSingle()

    return {
        client,
        isPlatformAdmin: false,
        role: membership?.role ?? minRole,
        userId: user.id
    }
}

/** Throws unless the caller is a platform admin. Used by /admin-only routes. */
export async function requirePlatformAdmin(event: H3Event) {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const client = await serverSupabaseClient<Database>(event)
    const { data: isPlatformAdmin, error } = await client.rpc('is_platform_admin')

    if (error) {
        throw createError({ statusCode: 500, statusMessage: 'Could not resolve platform admin status' })
    }

    if (!isPlatformAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Platform admin access required' })
    }

    return { client, userId: user.id }
}
