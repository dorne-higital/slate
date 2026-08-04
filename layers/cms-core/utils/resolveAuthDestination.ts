import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

/**
 * Where a signed-in user lands right after authenticating (plain sign-in
 * or setting a password from an invite link) — platform admins go to the
 * admin subdomain, site members to their first site's subdomain, falling
 * back to the internal path when no base domain is configured yet (see
 * buildTenantUrl in tenantUrl.ts). Shared by login.vue and confirm.vue so
 * the two never resolve a different destination for the same account.
 */
export async function resolveAuthDestination(
    client: SupabaseClient<Database>,
    userId: string,
    currentHost: string,
    baseDomain: string
): Promise<string> {
    const { data: profile } = await client.from('profiles').select('is_platform_admin').eq('id', userId).single()

    if (profile?.is_platform_admin) {
        return buildTenantUrl(currentHost, 'admin', baseDomain, '/admin')
    }

    const { data: membership } = await client
        .from('site_members')
        .select('site_id, sites(slug)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

    if (!membership?.sites) {
        return '/login'
    }

    return buildTenantUrl(currentHost, membership.sites.slug, baseDomain, `/sites/${membership.site_id}`)
}
