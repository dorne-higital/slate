import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import type { Database } from '../../types/database.types'

/**
 * The one deliberate exception to "nothing in the app ever uses the
 * service-role key to serve a user request" (see README.md). Inviting a
 * brand-new person (server/api/admin/signup-requests/[id]/convert.post.ts)
 * means creating an auth.users row, which has no RLS-scoped equivalent —
 * Supabase only exposes user creation/invitation through the Admin API,
 * which requires the service-role key by design. Every other server
 * route still uses the request-scoped client from requireSiteAccess /
 * requirePlatformAdmin. Callers must call requirePlatformAdmin(event)
 * themselves first — this function does no authorization of its own.
 */
export function supabaseServiceRoleClient(event: H3Event) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const { url } = useRuntimeConfig(event).public.supabase

    if (!serviceRoleKey) {
        throw createError({ statusCode: 500, statusMessage: 'SUPABASE_SERVICE_ROLE_KEY is not configured' })
    }

    return createClient<Database>(url, serviceRoleKey, {
        auth: { detectSessionInUrl: false, persistSession: false, autoRefreshToken: false }
    })
}
