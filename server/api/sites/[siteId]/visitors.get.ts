import { eq } from 'drizzle-orm'

/**
 * The last 30 days of visits from Slate's built-in stats (Cloudflare Web Analytics), for the Overview page.
 * { available: false } when the stats aren't set up yet, or the owner switched them off.
 */
interface Group { count: number, sum?: { visits: number }, dimensions?: { date?: string, requestPath?: string } }

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const config = useRuntimeConfig()
    const token = config.cloudflareDomainsToken
    if (!token || !config.cfAnalyticsSiteTag || !config.public.cfBeaconToken || site.integrations?.stats === 'off') return { available: false }

    const domains = await useDb().select({ hostname: schema.domains.hostname }).from(schema.domains).where(eq(schema.domains.siteId, site.id))
    const hosts = [`${site.slug}.${config.public.sitesDomain}`, ...domains.map(d => d.hostname)]
    const until = new Date()
    const since = new Date(until.getTime() - 30 * 86400000)
    const filter = { siteTag: config.cfAnalyticsSiteTag, requestHost_in: hosts, datetime_geq: since.toISOString(), datetime_leq: until.toISOString() }
    const query = `query ($account: String!, $filter: AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject) {
        viewer { accounts(filter: { accountTag: $account }) {
            total: rumPageloadEventsAdaptiveGroups(limit: 1, filter: $filter) { count sum { visits } }
            days: rumPageloadEventsAdaptiveGroups(limit: 31, filter: $filter, orderBy: [date_ASC]) { count sum { visits } dimensions { date } }
            pages: rumPageloadEventsAdaptiveGroups(limit: 5, filter: $filter, orderBy: [count_DESC]) { count dimensions { requestPath } }
        } }
    }`
    const account = await cloudflareAccountId().catch(() => null)
    if (!account) return { available: false }
    const res = await $fetch<{ data?: { viewer: { accounts: { total: Group[], days: Group[], pages: Group[] }[] } }, errors?: unknown }>('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}` },
        body: { query, variables: { account, filter } }
    }).catch(() => null)
    const a = res?.data?.viewer.accounts[0]
    if (!a) return { available: false }

    // Every day in the window, including quiet ones
    const byDay = new Map(a.days.map(d => [d.dimensions!.date!, d.sum?.visits ?? 0]))
    const days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(since.getTime() + (i + 1) * 86400000).toISOString().slice(0, 10)
        return { date, visits: byDay.get(date) ?? 0 }
    })
    return {
        available: true,
        visits: a.total[0]?.sum?.visits ?? 0,
        pageViews: a.total[0]?.count ?? 0,
        days,
        pages: a.pages.map(p => ({ path: p.dimensions!.requestPath!, views: p.count }))
    }
})
