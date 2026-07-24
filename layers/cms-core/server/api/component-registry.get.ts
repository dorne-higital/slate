import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database } from '../../types/database.types'

/**
 * component_registry is global (shared by every site), so this only needs
 * an authenticated caller, not a per-site check — see the
 * component_registry_select RLS policy in the migration.
 */
export default defineEventHandler(async (event) => {
    const user = await serverSupabaseUser(event)

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
    }

    const client = await serverSupabaseClient<Database>(event)

    const { data, error } = await client
        .from('component_registry')
        .select('type, label, description, icon, schema, created_at')
        .order('label', { ascending: true })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { componentRegistry: data }
})
