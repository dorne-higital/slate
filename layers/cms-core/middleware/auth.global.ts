/**
 * Keeps non-admins out of /admin. This is a UX convenience, not the
 * access boundary — /admin and /sites/[siteId] both re-verify access
 * themselves (via their API calls, which go through requireSiteAccess +
 * RLS), so a stale or bypassed redirect here can misroute a user but
 * can't leak data.
 *
 * Public routes opt in via `definePageMeta({ public: true })` in the
 * general case, but that alone isn't reliable here: `to.meta.public`
 * defined on a page in the *app* layer (app/pages/*.vue) does not
 * reliably resolve inside global middleware defined in the *cms-core*
 * layer, even though the build's static route manifest has the meta
 * correct on both sides — verified in production by instrumenting this
 * exact file with response headers (path=/, meta from an app-layer page,
 * consistently read back as undefined; path=/login, meta from a
 * cms-core-layer page, read back correctly). Root cause not identified,
 * but reliably reproducible, so PUBLIC_PATHS below is the actual access
 * boundary for top-level public pages, with meta kept as a secondary/
 * future-proofing check for pages not listed here (e.g. /preview/*).
 */
const PUBLIC_PATHS = new Set(['/', '/register', '/about', '/contact', '/guides', '/login', '/confirm'])

export default defineNuxtRouteMiddleware(async (to) => {
    // The public site renderer is meant for anonymous visitors by
    // design — see supabase/migrations/0005_public_site_access.sql.
    if (to.meta.public || PUBLIC_PATHS.has(to.path) || to.path.startsWith('/preview/')) {
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
