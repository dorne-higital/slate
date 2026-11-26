/**
 * Visitor stats for slatecms.co.uk itself, from Cloudflare Web Analytics (the beacon in plugins/slate-analytics.client.ts).
 * Each part is its own query, so one Cloudflare hiccup only blanks that part.
 */
interface Group { count: number, sum?: { visits: number }, dimensions?: Record<string, string> }
export interface Row { label: string, views: number, visits: number }

export interface MarketingVisitors {
    available: boolean
    views: number
    visits: number
    perDay: { date: string, views: number, visits: number }[]
    pages: Row[]
    referrers: Row[]
    countries: Row[]
    devices: Row[]
    browsers: Row[]
    systems: Row[]
    /** p75 in milliseconds (CLS unitless); null when Cloudflare has none yet */
    vitals: { lcp: number | null, inp: number | null, fcp: number | null, cls: number | null } | null
}

const EMPTY: MarketingVisitors = { available: false, views: 0, visits: 0, perDay: [], pages: [], referrers: [], countries: [], devices: [], browsers: [], systems: [], vitals: null }

export async function marketingVisitors(days: number): Promise<MarketingVisitors> {
    const config = useRuntimeConfig()
    const token = config.cloudflareDomainsToken
    if (!token || !config.cfAnalyticsSiteTag || !config.public.cfBeaconToken) return EMPTY
    const account = await cloudflareAccountId().catch(() => null)
    if (!account) return EMPTY
    const app = stripPort(config.public.appHost)
    const until = new Date()
    const since = new Date(until.getTime() - days * 86400000)
    const base = { siteTag: config.cfAnalyticsSiteTag, requestHost_in: [app, `www.${app}`], datetime_geq: since.toISOString(), datetime_leq: until.toISOString() }
    // The dashboard and admin aren't marketing pages
    const filter = { ...base, AND: ['/sites%', '/admin%', '/account%', '/invite%'].map(p => ({ requestPath_notlike: p })) }

    async function run(dataset: string, fields: string, extra = '', f: object = filter): Promise<Group[] | null> {
        const query = `query ($account: String!, $filter: ${dataset === 'rumWebVitalsEventsAdaptiveGroups' ? 'AccountRumWebVitalsEventsAdaptiveGroupsFilter_InputObject' : 'AccountRumPageloadEventsAdaptiveGroupsFilter_InputObject'}) {
            viewer { accounts(filter: { accountTag: $account }) { g: ${dataset}(filter: $filter${extra}) { ${fields} } } }
        }`
        const res = await $fetch<{ data?: { viewer: { accounts: { g: Group[] }[] } } }>('https://api.cloudflare.com/client/v4/graphql', {
            method: 'POST',
            headers: { authorization: `Bearer ${token}` },
            body: { query, variables: { account, filter: f } }
        }).catch(() => null)
        return res?.data?.viewer.accounts[0]?.g ?? null
    }
    const by = (dim: string, limit: number) => run('rumPageloadEventsAdaptiveGroups', `count sum { visits } dimensions { ${dim} }`, `, limit: ${limit}, orderBy: [count_DESC]`)
    const rows = (g: Group[] | null, dim: string): Row[] => (g ?? []).map(x => ({ label: x.dimensions?.[dim] || '(none)', views: x.count, visits: x.sum?.visits ?? 0 }))

    const [total, daysG, pages, refs, countries, devices, browsers, systems, vitals] = await Promise.all([
        run('rumPageloadEventsAdaptiveGroups', 'count sum { visits }', ', limit: 1'),
        run('rumPageloadEventsAdaptiveGroups', 'count sum { visits } dimensions { date }', `, limit: ${days + 1}, orderBy: [date_ASC]`),
        by('requestPath', 30),
        by('refererHost', 25),
        by('countryName', 20),
        by('deviceType', 6),
        by('userAgentBrowser', 10),
        by('userAgentOS', 10),
        run('rumWebVitalsEventsAdaptiveGroups', 'quantiles { largestContentfulPaintP75 interactionToNextPaintP75 firstContentfulPaintP75 cumulativeLayoutShiftP75 }', ', limit: 1')
    ])
    if (!total) return EMPTY

    const byDay = new Map((daysG ?? []).map(d => [d.dimensions!.date!, d]))
    const perDay = Array.from({ length: days }, (_, i) => {
        const date = new Date(since.getTime() + (i + 1) * 86400000).toISOString().slice(0, 10)
        const d = byDay.get(date)
        return { date, views: d?.count ?? 0, visits: d?.sum?.visits ?? 0 }
    })
    // Cloudflare reports timings in microseconds
    const q = (vitals?.[0] as unknown as { quantiles?: Record<string, number | null> } | undefined)?.quantiles
    const ms = (v: number | null | undefined) => v == null ? null : Math.round(v > 60000 ? v / 1000 : v)
    return {
        available: true,
        views: total[0]?.count ?? 0,
        visits: total[0]?.sum?.visits ?? 0,
        perDay,
        pages: rows(pages, 'requestPath'),
        referrers: rows(refs, 'refererHost').filter(r => r.label !== app && r.label !== `www.${app}`),
        countries: rows(countries, 'countryName'),
        devices: rows(devices, 'deviceType'),
        browsers: rows(browsers, 'userAgentBrowser'),
        systems: rows(systems, 'userAgentOS'),
        vitals: q ? { lcp: ms(q.largestContentfulPaintP75), inp: ms(q.interactionToNextPaintP75), fcp: ms(q.firstContentfulPaintP75), cls: q.cumulativeLayoutShiftP75 ?? null } : null
    }
}
