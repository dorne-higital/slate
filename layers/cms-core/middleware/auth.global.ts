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
    // TEMPORARY diagnostic — remove once the production redirect bug is
    // root-caused. Surfaces what this middleware actually saw for a
    // given request as response headers, visible via curl -I, without
    // needing Vercel runtime log access. Raw Node req/res APIs only,
    // deliberately avoiding H3/Nitro auto-imports that may not resolve
    // in this (app-level route middleware, not server/) context.
    if (import.meta.server) {
        const event = useRequestEvent()
        if (event?.node?.res && !event.node.res.headersSent) {
            event.node.res.setHeader('x-debug-to-path', to.path)
            event.node.res.setHeader('x-debug-meta-public', JSON.stringify(to.meta.public ?? null))
            event.node.res.setHeader('x-debug-host', String(event.node.req.headers['x-forwarded-host'] ?? event.node.req.headers.host ?? 'unknown'))
            event.node.res.setHeader('x-debug-tenant-header', String(event.node.req.headers['x-slate-tenant-domain'] ?? 'none'))
        }
    }

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
