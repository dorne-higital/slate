import { requirePlatformAdmin } from '../../utils/requireSiteAccess'

/**
 * Platform-admin only. Not a new privacy exposure — the profiles_select
 * RLS policy already lets a platform admin read every profile row (same
 * access the /admin dashboard's site-membership lists rely on); this just
 * gives that existing access a dedicated, purpose-built endpoint for
 * populating a user picker instead of requiring a raw UUID.
 */
export default defineEventHandler(async (event) => {
    const { client } = await requirePlatformAdmin(event)

    const { data, error } = await client
        .from('profiles')
        .select('id, email, full_name')
        .order('email', { ascending: true })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { users: data }
})
