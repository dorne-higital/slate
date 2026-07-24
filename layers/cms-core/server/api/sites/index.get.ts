import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '../../../types/database.types'

/**
 * Lists sites visible to the caller. No explicit requireSiteAccess() call
 * here — there's no single siteId to check yet, this route's whole job is
 * to discover which sites the caller may see. RLS on `sites` (platform
 * admin sees all, everyone else sees only sites they're a member of) is
 * the sole access boundary, which is exactly what it's designed for.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const client = await serverSupabaseClient<Database>(event)

    const { data, error } = await client
        .from('sites')
        .select('id, name, slug, status, created_at, updated_at, site_members(user_id, role, profiles(email, full_name)), pages(count)')
        .order('updated_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { sites: data }
})
