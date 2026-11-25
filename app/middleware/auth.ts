// Routing convenience only; the server checks access on every request.
export default defineNuxtRouteMiddleware(async (to) => {
    const me = await useMe().ensure()
    if (!me) return navigateTo({ path: '/login', query: { next: to.fullPath } })
})
