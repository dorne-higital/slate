/**
 * A client site's "get the app" link (what the showcase blocks' QR code opens): iPhones and iPads
 * go to the App Store, Android phones to Google Play, anyone else to the only store set or the home page.
 */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const { appStore, googlePlay } = site.socials ?? {}
    const ua = getRequestHeader(event, 'user-agent') ?? ''
    const target = /iphone|ipad|ipod/i.test(ua) && appStore
        ? appStore
        : /android/i.test(ua) && googlePlay
            ? googlePlay
            : appStore && !googlePlay ? appStore : googlePlay && !appStore ? googlePlay : '/'
    setResponseHeader(event, 'cache-control', 'no-store')
    return sendRedirect(event, target, 302)
})
