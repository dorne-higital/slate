// While Slate is "coming soon", the marketing pages are only for platform admins to preview.
// Everyone else gets the coming-soon home page, plus privacy and terms shown on their own
// (no menus linking to pages that aren't out yet).
const LEGAL = ['/privacy', '/terms']

export default defineNuxtRouteMiddleware(async (to) => {
    const { comingSoon } = useRuntimeConfig().public
    if (!comingSoon || to.path === '/') return
    const { me, ensure } = useMe()
    await ensure()
    const admin = !!me.value?.isPlatformAdmin
    if (LEGAL.includes(to.path)) {
        if (!admin) setPageLayout('default')
        return
    }
    if (!admin) return navigateTo('/', { redirectCode: 302 })
})
