<script setup lang="ts">
// Admin → Marketing: visitors to slatecms.co.uk, the waiting list, sign-ups and where they came from.
definePageMeta({ middleware: 'auth' })
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Marketing · Slate admin' })

interface Row { label: string, views: number, visits: number }
interface Source { label: string, count: number, paying: number }
interface Stats {
    days: number
    visitors: { available: boolean, views: number, visits: number, perDay: { date: string, views: number, visits: number }[], pages: Row[], referrers: Row[], countries: Row[], devices: Row[], browsers: Row[], systems: Row[], vitals: { lcp: number | null, inp: number | null, fcp: number | null, cls: number | null } | null }
    waitingList: { total: number, inRange: number, perDay: { date: string, n: number }[], sources: Source[], landings: { path: string, count: number }[], recent: { name: string | null, email: string, business: string | null, at: string, source: string, landing: string | null }[] }
    signups: { inRange: number, trials: number, paying: number, perDay: { date: string, n: number }[], sources: Source[], landings: { path: string, count: number }[], recent: { name: string, email: string, at: string, siteId: string | null, siteName: string | null, source: string, landing: string | null, status: string | null, plan: string | null }[] }
}

const days = ref(30)
const { data, pending, refresh } = await useAsyncData('admin-marketing', () => useRequestFetch()<Stats>('/api/admin/marketing', { query: { days: days.value } }), { watch: [days] })
const v = computed(() => data.value?.visitors)
const pct = (a: number, b: number) => b ? `${(a / b * 100).toFixed(a / b < 0.1 ? 1 : 0)}%` : '–'
const num = (n: number) => n.toLocaleString('en-GB')
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const dayLabel = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

// Chart: visits per day as bars, sign-ups and waiting-list joins as dots
const chart = computed(() => {
    const d = data.value
    if (!d) return null
    const vis = v.value?.available ? v.value.perDay : d.signups.perDay.map(x => ({ date: x.date, visits: 0, views: 0 }))
    const max = Math.max(1, ...vis.map(x => x.visits))
    const joins = d.signups.perDay.map((s, i) => s.n + (d.waitingList.perDay[i]?.n ?? 0))
    const maxJ = Math.max(1, ...joins)
    const w = 100 / vis.length
    return { bars: vis.map((x, i) => ({ x: i * w, w: w * 0.72, h: x.visits / max * 100, label: `${dayLabel(x.date)}: ${x.visits} visits, ${joins[i]} sign-ups or joins` })), dots: joins.map((n, i) => n ? { cx: i * w + w * 0.36, cy: 100 - n / maxJ * 92, n } : null).filter(Boolean) as { cx: number, cy: number, n: number }[], max, maxJ, first: vis[0]?.date, last: vis.at(-1)?.date }
})

const VITALS = [
    { key: 'lcp', name: 'Largest content shown', good: 2500, poor: 4000, unit: 'ms', help: 'How long until the main content appears' },
    { key: 'fcp', name: 'First content shown', good: 1800, poor: 3000, unit: 'ms', help: 'How long until anything appears' },
    { key: 'inp', name: 'Response to taps', good: 200, poor: 500, unit: 'ms', help: 'How quickly the page reacts' },
    { key: 'cls', name: 'Layout shift', good: 0.1, poor: 0.25, unit: '', help: 'How much things jump around' }
] as const
const grade = (val: number | null, good: number, poor: number) => val == null ? 'none' : val <= good ? 'good' : val <= poor ? 'ok' : 'poor'

const tables = computed(() => v.value?.available
    ? [
            { title: 'Top pages', rows: v.value.pages, col: 'Page' },
            { title: 'Where visitors came from', rows: v.value.referrers, col: 'Site', empty: 'No links from other sites yet' },
            { title: 'Countries', rows: v.value.countries, col: 'Country' },
            { title: 'Devices', rows: v.value.devices, col: 'Device' },
            { title: 'Browsers', rows: v.value.browsers, col: 'Browser' },
            { title: 'Operating systems', rows: v.value.systems, col: 'System' }
        ]
    : [])
const share = (n: number, rows: Row[]) => pct(n, rows.reduce((a, r) => a + r.views, 0))
const signupViews = computed(() => v.value?.pages.find(p => p.label === '/signup')?.views ?? 0)
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <div>
                    <h1>Marketing</h1>
                    <p class="muted">Visitors to slatecms.co.uk (cookie-free, via Cloudflare), the waiting list and sign-ups, and where people came from. Your own visits aren’t counted.</p>
                </div>
                <div class="tools">
                    <div class="seg" role="group" aria-label="Period">
                        <button v-for="d in [7, 30, 90]" :key="d" type="button" :aria-pressed="days === d" :class="{ on: days === d }" @click="days = d">{{ d }} days</button>
                    </div>
                    <button class="btn btn-ghost btn-sm" type="button" :disabled="pending" @click="() => refresh()">{{ pending ? 'Loading…' : 'Refresh' }}</button>
                </div>
            </div>

            <template v-if="data">
                <ul class="kpis">
                    <li class="panel"><span>Visitors</span><b>{{ v?.available ? num(v.visits) : '–' }}</b><small>{{ v?.available ? `${num(v.views)} page views` : 'Shows on the live site' }}</small></li>
                    <li class="panel"><span>Sign-ups</span><b>{{ num(data.signups.inRange) }}</b><small>{{ v?.available ? `${pct(data.signups.inRange, v.visits)} of visitors` : `in ${data.days} days` }}</small></li>
                    <li class="panel"><span>On a free trial</span><b>{{ num(data.signups.trials) }}</b><small>of those sign-ups</small></li>
                    <li class="panel"><span>Now paying</span><b>{{ num(data.signups.paying) }}</b><small>{{ pct(data.signups.paying, data.signups.inRange) }} of sign-ups</small></li>
                    <li class="panel"><span>Waiting list</span><b>{{ num(data.waitingList.total) }}</b><small>{{ data.waitingList.inRange }} joined in {{ data.days }} days</small></li>
                    <li v-if="v?.available" class="panel"><span>Saw the sign-up page</span><b>{{ num(signupViews) }}</b><small>{{ pct(data.signups.inRange, signupViews) }} finished signing up</small></li>
                </ul>

                <section class="panel">
                    <h2>Every day</h2>
                    <p class="muted small">Bars are visitors{{ v?.available ? ` (busiest day ${chart?.max})` : ', once the live site has some' }}. Dots are sign-ups and waiting-list joins.</p>
                    <svg v-if="chart" class="chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" :aria-label="`Visitors and sign-ups per day over ${data.days} days`">
                        <rect v-for="(b, i) in chart.bars" :key="i" :x="b.x" :y="100 - b.h" :width="b.w" :height="b.h" class="bar"><title>{{ b.label }}</title></rect>
                    </svg>
                    <div v-if="chart" class="dots" aria-hidden="true">
                        <span v-for="(d, i) in chart.dots" :key="i" class="dot" :style="{ left: `${d.cx}%`, top: `${d.cy}%` }">{{ d.n }}</span>
                    </div>
                    <div v-if="chart" class="axis"><span>{{ dayLabel(chart.first!) }}</span><span>{{ dayLabel(chart.last!) }}</span></div>
                </section>

                <section v-if="!v?.available" class="panel note">
                    <b>Visitor numbers appear on the live site.</b> They come from Cloudflare, which this computer can’t reach, and need visits to slatecms.co.uk after the stats were switched on.
                </section>

                <div class="grid">
                    <section class="panel">
                        <h2>Sign-ups by source</h2>
                        <table v-if="data.signups.sources.length">
                            <thead><tr><th>Came from</th><th class="n">Sign-ups</th><th class="n">Paying</th></tr></thead>
                            <tbody><tr v-for="s in data.signups.sources" :key="s.label"><td>{{ s.label }}</td><td class="n">{{ s.count }}</td><td class="n">{{ s.paying }} <small class="muted">{{ pct(s.paying, s.count) }}</small></td></tr></tbody>
                        </table>
                        <p v-else class="muted">No sign-ups in this period.</p>
                    </section>
                    <section class="panel">
                        <h2>First page sign-ups saw</h2>
                        <table v-if="data.signups.landings.length">
                            <thead><tr><th>Page</th><th class="n">Sign-ups</th></tr></thead>
                            <tbody><tr v-for="l in data.signups.landings" :key="l.path"><td><a :href="l.path" target="_blank" rel="noopener">{{ l.path }}</a></td><td class="n">{{ l.count }}</td></tr></tbody>
                        </table>
                        <p v-else class="muted">Recorded for sign-ups from now on.</p>
                    </section>
                    <section class="panel">
                        <h2>Waiting list by source</h2>
                        <table v-if="data.waitingList.sources.length">
                            <thead><tr><th>Came from</th><th class="n">Joined</th></tr></thead>
                            <tbody><tr v-for="s in data.waitingList.sources" :key="s.label"><td>{{ s.label }}</td><td class="n">{{ s.count }}</td></tr></tbody>
                        </table>
                        <p v-else class="muted">Nobody joined in this period.</p>
                    </section>

                    <section v-for="t in tables" :key="t.title" class="panel">
                        <h2>{{ t.title }}</h2>
                        <table v-if="t.rows.length">
                            <thead><tr><th>{{ t.col }}</th><th class="n">Views</th><th class="n">Share</th></tr></thead>
                            <tbody>
                                <tr v-for="r in t.rows" :key="r.label">
                                    <td><a v-if="t.col === 'Page'" :href="r.label" target="_blank" rel="noopener">{{ r.label }}</a><template v-else>{{ r.label }}</template></td>
                                    <td class="n">{{ num(r.views) }}</td><td class="n muted">{{ share(r.views, t.rows) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else class="muted">{{ t.empty ?? 'Nothing yet' }}</p>
                    </section>

                    <section v-if="v?.available" class="panel">
                        <h2>Page speed (real visitors)</h2>
                        <p class="muted small">What 3 in 4 visitors got or better. Google uses these in rankings.</p>
                        <ul class="vitals">
                            <li v-for="m in VITALS" :key="m.key" :class="grade(v.vitals?.[m.key] ?? null, m.good, m.poor)">
                                <span><b>{{ m.name }}</b><small class="muted">{{ m.help }}</small></span>
                                <strong>{{ v.vitals?.[m.key] == null ? '–' : m.unit ? `${num(v.vitals[m.key]!)} ${m.unit}` : v.vitals[m.key]!.toFixed(2) }}</strong>
                            </li>
                        </ul>
                    </section>
                </div>

                <section class="panel">
                    <h2>Recent sign-ups</h2>
                    <div class="scroll">
                        <table v-if="data.signups.recent.length">
                            <thead><tr><th>Who</th><th>Site</th><th>Came from</th><th>First page</th><th>Status</th><th>When</th></tr></thead>
                            <tbody>
                                <tr v-for="p in data.signups.recent" :key="p.email">
                                    <td><b>{{ p.name }}</b><br><small class="muted">{{ p.email }}</small></td>
                                    <td><NuxtLink v-if="p.siteId" :to="`/sites/${p.siteId}`">{{ p.siteName }}</NuxtLink></td>
                                    <td>{{ p.source }}</td>
                                    <td><small>{{ p.landing ?? '' }}</small></td>
                                    <td><span class="pill" :class="p.status ?? ''">{{ p.status === 'active' ? (p.plan ?? 'paying') : p.status ?? '–' }}</span></td>
                                    <td class="nowrap">{{ when(p.at) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else class="muted">No sign-ups in this period.</p>
                    </div>
                </section>

                <section class="panel">
                    <h2>Recent waiting-list joins</h2>
                    <div class="scroll">
                        <table v-if="data.waitingList.recent.length">
                            <thead><tr><th>Who</th><th>Business</th><th>Came from</th><th>First page</th><th>When</th></tr></thead>
                            <tbody>
                                <tr v-for="p in data.waitingList.recent" :key="p.email">
                                    <td><b>{{ p.name ?? '–' }}</b><br><small class="muted">{{ p.email }}</small></td>
                                    <td>{{ p.business ?? '' }}</td>
                                    <td>{{ p.source }}</td>
                                    <td><small>{{ p.landing ?? '' }}</small></td>
                                    <td class="nowrap">{{ when(p.at) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else class="muted">Nobody joined in this period.</p>
                    </div>
                </section>
            </template>
        </main>
    </div>
</template>

<style scoped>
.admin { background: var(--paper); min-height: 100vh; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1240px; padding: 28px 24px 60px; }
.head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 28px; margin: 0 0 4px; }
h2 { font-size: 16px; margin: 0 0 10px; }
.muted { color: var(--text-muted); }
.small { font-size: 13px; margin: -4px 0 12px; }
.tools { align-items: center; display: flex; gap: 10px; }
.seg { background: var(--white); border-radius: var(--radius); box-shadow: inset 0 0 0 1px var(--line); display: flex; padding: 3px; }
.seg button { background: none; border: 0; border-radius: 6px; color: var(--text-body); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; padding: 6px 12px; }
.seg button.on { background: var(--quarry); color: var(--white); }
.panel { background: var(--white); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line); padding: 18px 20px; position: relative; }
.kpis { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); list-style: none; margin: 0; padding: 0; }
.kpis li { display: flex; flex-direction: column; gap: 2px; }
.kpis span { color: var(--text-muted); font-size: 13px; font-weight: 600; }
.kpis b { font-size: 30px; letter-spacing: -.03em; }
.kpis small { color: var(--text-muted); font-size: 12.5px; }
.chart { display: block; height: 160px; width: 100%; }
.bar { fill: var(--mist-strong, #c3c8d1); }
.bar:hover { fill: var(--heather); }
.dots { height: 160px; left: 20px; pointer-events: none; position: absolute; right: 20px; top: 74px; }
.dot { align-items: center; background: var(--lichen); border-radius: 999px; box-shadow: 0 0 0 2px var(--white); color: var(--quarry); display: flex; font-size: 10px; font-weight: 800; height: 18px; justify-content: center; min-width: 18px; position: absolute; transform: translate(-50%, -50%); }
.axis { color: var(--text-muted); display: flex; font-size: 12px; justify-content: space-between; margin-top: 6px; }
.note { background: var(--mist); box-shadow: none; font-size: 14.5px; }
.grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); }
table { border-collapse: collapse; font-size: 14px; width: 100%; }
th { border-bottom: 1px solid var(--line); color: var(--text-muted); font-size: 12px; font-weight: 700; padding: 6px 8px; text-align: left; text-transform: uppercase; }
td { border-bottom: 1px solid var(--line-soft); padding: 7px 8px; vertical-align: top; word-break: break-word; }
td a { color: var(--heather); }
.n { text-align: right; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.scroll { overflow-x: auto; }
.pill { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 2px 9px; text-transform: capitalize; }
.pill.active { background: #e3f1e6; color: #1d6b34; }
.pill.trial { background: #fdf2dc; color: #8a5a00; }
.pill.expired { background: #fbeceb; color: var(--danger); }
.vitals { display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 0; padding: 0; }
.vitals li { align-items: center; border-left: 4px solid var(--line); display: flex; justify-content: space-between; padding: 4px 0 4px 12px; }
.vitals li span { display: flex; flex-direction: column; }
.vitals li.good { border-color: #2e8b4a; }
.vitals li.ok { border-color: var(--lichen); }
.vitals li.poor { border-color: var(--danger); }
@media (max-width: 640px) {
    .wrap { padding: 20px 16px 48px; }
    .grid { grid-template-columns: 1fr; }
}
</style>
