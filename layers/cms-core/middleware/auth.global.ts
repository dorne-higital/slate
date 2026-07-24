const PUBLIC_ROUTES = new Set(['/login'])

/**
 * Sends platform admins to /admin and everyone else to their own site(s).
 * This is a UX convenience, not the access boundary — /admin and
 * /sites/[siteId] both re-verify access themselves (via their API calls,
 * which go through requireSiteAccess + RLS), so a stale or bypassed
 * redirect here can misroute a user but can't leak data.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    // The public site renderer is meant for anonymous visitors by
    // design — see supabase/migrations/0005_public_site_access.sql.
    if (PUBLIC_ROUTES.has(to.path) || to.path.startsWith('/preview/')) {
        return
    }

    const user = useSupabaseUser()

    if (!user.value) {
        return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }

    const { isPlatformAdmin, siteIds } = await useCurrentAccess()

    if (isPlatformAdmin) {
        if (to.path === '/') {
            return navigateTo('/admin')
        }
        return
    }

    if (to.path === '/' || to.path.startsWith('/admin')) {
        return navigateTo(siteIds[0] ? `/sites/${siteIds[0]}` : '/login')
    }
})
