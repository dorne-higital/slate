import type { Profile, SiteMember } from '../types'
import type { Database } from '../types/database.types'

/**
 * Resolves the signed-in user's profile + site memberships. This is a
 * convenience/UX layer only (driving redirects and nav) — it is never the
 * security boundary. Actual data access is always re-checked by RLS and,
 * for API routes, requireSiteAccess().
 */
export async function useCurrentAccess() {
    const user = useSupabaseUser()

    if (!user.value) {
        return {
            profile: null as Profile | null,
            memberships: [] as SiteMember[],
            isPlatformAdmin: false,
            siteIds: [] as string[]
        }
    }

    const client = useSupabaseClient<Database>()
    const userId = user.value.id

    const { data } = await useAsyncData(`current-access-${userId}`, async () => {
        const [{ data: profile }, { data: memberships }] = await Promise.all([
            client.from('profiles').select('*').eq('id', userId).single(),
            client.from('site_members').select('*').eq('user_id', userId)
        ])

        return { profile: profile ?? null, memberships: memberships ?? [] }
    })

    const profile = data.value?.profile ?? null
    const memberships = data.value?.memberships ?? []

    return {
        profile,
        memberships,
        isPlatformAdmin: profile?.is_platform_admin ?? false,
        siteIds: memberships.map(member => member.site_id)
    }
}
