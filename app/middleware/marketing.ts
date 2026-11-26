// While Slate is "coming soon", the marketing pages (other than the coming-soon home, privacy and terms)
// are only for platform admins to preview. Everyone else goes to the coming-soon page.
const ALWAYS_OPEN = ['/', '/privacy', '/terms']

export default defineNuxtRouteMiddleware(async (to) => {
    const { comingSoon } = useRuntimeConfig().public
    if (!comingSoon || ALWAYS_OPEN.includes(to.path)) return
    const { me, ensure } = useMe()
    await ensure()
    if (!me.value?.isPlatformAdmin) return navigateTo('/', { redirectCode: 302 })
})
