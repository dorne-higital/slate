// slatecms.co.uk only (client sites have their own stats in SiteTracking.vue):
//  1. Cloudflare Web Analytics: cookie-free visitor stats, shown in Admin → Marketing
//  2. Remembers where this browser first came from (search, social, a campaign link), sent with a sign-up
// Not on the dashboard or admin, and never for platform admins (the admin pages set "slate-no-track").
const PRIVATE = /^\/(sites|admin|account|invite)(\/|$)/

export default defineNuxtPlugin(() => {
    const config = useRuntimeConfig().public
    if (!isAppHost(location.host, config.appHost)) return
    const route = useRoute()
    let skip = false
    try {
        skip = localStorage.getItem('slate-no-track') === '1'
        if (!skip && !localStorage.getItem('slate-source')) {
            const params = new URLSearchParams(location.search)
            const ref = document.referrer ? new URL(document.referrer).hostname : ''
            const utm = [params.get('utm_source'), params.get('utm_campaign')].filter(Boolean).join(' / ')
            localStorage.setItem('slate-source', JSON.stringify({
                ref: ref && !isAppHost(ref, config.appHost) ? ref : undefined,
                landing: location.pathname,
                utm: utm || undefined,
                at: new Date().toISOString()
            }))
        }
    } catch {
        // Storage blocked: no source, stats still work
    }
    if (skip || PRIVATE.test(route.path) || !config.cfBeaconToken) return
    const s = document.createElement('script')
    s.defer = true
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    s.dataset.cfBeacon = JSON.stringify({ token: config.cfBeaconToken, spa: true })
    document.head.appendChild(s)
})
