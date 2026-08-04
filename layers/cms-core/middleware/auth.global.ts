/**
 * Keeps non-admins out of /admin. This is a UX convenience, not the
 * access boundary — /admin and /sites/[siteId] both re-verify access
 * themselves (via their API calls, which go through requireSiteAccess +
 * RLS), so a stale or bypassed redirect here can misroute a user but
 * can't leak data.
 *
 * Public routes (the marketing site, /login) opt in via
 * `definePageMeta({ public: true })` rather than a hardcoded path list
 * here — cms-core stays agnostic to which of a consuming app's own pages
 * are public.
 */
export default defineNuxtRouteMiddleware(async (to) => {
    // The public site renderer is meant for anonymous visitors by
    // design — see supabase/migrations/0005_public_site_access.sql.
    if (to.meta.public || to.path.startsWith('/preview/')) {
        return
    }

    const user = useSupabaseUser()

    if (!user.value) {
        return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
    }

    const { isPlatformAdmin, siteIds } = await useCurrentAccess()

    if (isPlatformAdmin) {
        return
    }

    if (to.path.startsWith('/admin')) {
        return navigateTo(siteIds[0] ? `/sites/${siteIds[0]}` : '/login')
    }
})
