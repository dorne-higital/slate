/** Old addresses on Slate's own site (never on client sites): the "who it's for" pages used to live at /for. */
export default defineEventHandler((event) => {
    const path = event.path.split('?')[0]!
    if (path !== '/for' && !path.startsWith('/for/')) return
    if (!isAppHost(getRequestHost(event), useRuntimeConfig().public.appHost)) return
    return sendRedirect(event, path.replace(/^\/for/, '/websites-for'), 301)
})
