<script setup lang="ts">
// Platform admin: every site on Slate. The API refuses anyone who isn't a platform admin.
definePageMeta({ middleware: 'auth' })
const { me, signOut } = useMe()
if (!me.value?.isPlatformAdmin) await navigateTo(me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/')

interface AdminSite {
    id: string
    name: string
    slug: string
    address: string
    ownerName: string | null
    ownerEmail: string | null
    pageCount: number
    createdAt: string
    deletedAt: string | null
    offline: boolean
    billing: { status: BillingStatus, plan: string | null }
}

const fetcher = useRequestFetch()
interface AdminOverview {
    live: boolean
    sites: { live: number, offline: number, deleted: number, new7: number }
    people: { total: number, new7: number, new30: number }
    billing: { trial: number, expired: number, pastDue: number, cancelling: number, starter: number, business: number, studio: number, paying: number, mrr: number, domainRevenueYear: number }
    domains: { active: number, pending: number, error: number, bought: number, failedOrders: number }
    activity: { replies7: number, published7: number }
    support: { open: number }
    signups: { day: string, n: number }[]
    recentUsers: { name: string, email: string, createdAt: string, siteName: string | null, siteId: string | null }[]
    attention: { kind: string, text: string, detail: string, link?: string }[]
}
const { data: ov } = await useAsyncData('admin-overview', () => fetcher<AdminOverview>('/api/admin/overview'))
const maxSignup = computed(() => Math.max(1, ...(ov.value?.signups ?? []).map(d => d.n)))
const planBars = computed(() => {
    const b = ov.value?.billing
    if (!b) return []
    const rows = [
        { label: 'Free trial', n: b.trial, cls: 'trial' },
        { label: 'Starter', n: b.starter, cls: 'starter' },
        { label: 'Business', n: b.business, cls: 'business' },
        { label: 'Studio', n: b.studio, cls: 'studio' },
        { label: 'Paused (trial ended)', n: b.expired, cls: 'expired' }
    ]
    const max = Math.max(1, ...rows.map(r => r.n))
    return rows.map(r => ({ ...r, pct: Math.round((r.n / max) * 100) }))
})
const statusFilter = ref<'all' | BillingStatus>('all')
const statusName: Record<BillingStatus, string> = { comped: 'No bill', trial: 'Trial', active: 'Paying', past_due: 'Payment failed', expired: 'Paused' }
const { data, refresh } = await useAsyncData('admin-sites', () => fetcher<{ totals: { sites: number, users: number }, sites: AdminSite[] }>('/api/admin/sites'))
useHead({ title: 'All sites · Slate' })

// Register-interest list from the coming-soon page
interface Interested { id: string, email: string, name: string | null, business: string | null, createdAt: string }
const { data: interest, refresh: refreshInterest } = await useAsyncData('admin-interest', () => fetcher<Interested[]>('/api/admin/interest'), { default: () => [] })
const showAllInterest = ref(false)
const interestShown = computed(() => showAllInterest.value ? interest.value : interest.value.slice(0, 8))
async function removeInterest(id: string) {
    await $fetch(`/api/admin/interest/${id}`, { method: 'DELETE' })
    await refreshInterest()
}
const { comingSoon } = useRuntimeConfig().public

const search = ref('')
const shown = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (statusFilter.value !== 'all') return (data.value?.sites ?? []).filter(x => x.billing.status === statusFilter.value && (!q || [x.name, x.address, x.ownerName ?? '', x.ownerEmail ?? ''].join(' ').toLowerCase().includes(q)))
    return (data.value?.sites ?? []).filter(s => !q || [s.name, s.address, s.ownerName ?? '', s.ownerEmail ?? ''].some(v => v.toLowerCase().includes(q)))
})
async function restore(id: string) {
    await $fetch(`/api/admin/sites/${id}/restore`, { method: 'POST' })
    await refresh()
    await useMe().refresh()
}
const linkFor = (address: string) => `${address.includes('localhost') ? 'http' : 'https'}://${address}`
</script>

<template>
    <div class="admin">
        <AdminHeader />

        <main class="wrap">
            <div class="head">
                <h1>Slate dashboard</h1>
                <p class="muted big">Everything across Slate. {{ ov?.live ? 'Payments are live.' : 'Payments are in Stripe test mode, so revenue here is test money.' }}</p>
            </div>

            <ul v-if="ov" class="kpis" aria-label="Key numbers">
                <li class="panel kpi hi"><span>Monthly revenue</span><b>{{ formatPence(ov.billing.mrr) }}</b><small>{{ ov.billing.paying }} paying {{ ov.billing.paying === 1 ? 'account' : 'accounts' }}<template v-if="ov.billing.domainRevenueYear"> · domains {{ formatPence(ov.billing.domainRevenueYear) }}/yr</template></small></li>
                <li class="panel kpi"><span>On free trial</span><b>{{ ov.billing.trial }}</b><small>{{ ov.billing.expired }} paused after trial</small></li>
                <li class="panel kpi"><span>Live sites</span><b>{{ ov.sites.live }}</b><small>{{ ov.sites.new7 }} new this week · {{ ov.sites.offline }} offline</small></li>
                <li class="panel kpi"><span>People</span><b>{{ ov.people.total }}</b><small>{{ ov.people.new7 }} this week · {{ ov.people.new30 }} this month</small></li>
                <li class="panel kpi"><span>Custom domains</span><b>{{ ov.domains.active }}</b><small>{{ ov.domains.pending }} waiting · {{ ov.domains.bought }} bought through Slate</small></li>
                <li class="panel kpi"><NuxtLink to="/admin/support" class="kpi-link"><span>Support tickets waiting</span><b>{{ ov.support.open }}</b><small>{{ ov.support.open ? 'Reply in Support' : 'All answered' }}</small></NuxtLink></li>
                <li class="panel kpi"><span>Activity this week</span><b>{{ ov.activity.replies7 }}</b><small>form replies · {{ ov.activity.published7 }} pages published</small></li>
            </ul>

            <div v-if="ov" class="dash">
                <section class="panel box" aria-labelledby="su-h">
                    <h2 id="su-h">Sign-ups, last 30 days</h2>
                    <div class="bars" role="img" :aria-label="`${ov.people.new30} sign-ups in the last 30 days`">
                        <span v-for="d in ov.signups" :key="d.day" class="bar" :style="{ height: `${Math.max(3, (d.n / maxSignup) * 100)}%` }" :class="{ zero: !d.n }" :title="`${new Date(d.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: ${d.n}`" />
                    </div>
                    <div class="bar-axis muted"><span>{{ new Date(ov.signups[0]!.day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }}</span><span>Today</span></div>
                </section>

                <section class="panel box" aria-labelledby="pl-h">
                    <h2 id="pl-h">Plans</h2>
                    <ul class="plan-bars">
                        <li v-for="r in planBars" :key="r.label"><span class="pb-label">{{ r.label }}</span><span class="pb-track"><span class="pb-fill" :class="r.cls" :style="{ width: `${r.pct}%` }" /></span><b>{{ r.n }}</b></li>
                    </ul>
                    <p v-if="ov.billing.cancelling || ov.billing.pastDue" class="muted small">{{ ov.billing.cancelling }} cancelling at period end · {{ ov.billing.pastDue }} with a failed payment</p>
                </section>

                <section class="panel box" aria-labelledby="at-h">
                    <h2 id="at-h">Needs your attention</h2>
                    <ul v-if="ov.attention.length" class="attn">
                        <li v-for="(a, i) in ov.attention" :key="i" :class="`k-${a.kind}`">
                            <NuxtLink v-if="a.link" :to="a.link" class="attn-link"><b>{{ a.text }}</b></NuxtLink>
                            <b v-else>{{ a.text }}</b>
                            <span class="muted">{{ a.detail }}</span>
                        </li>
                    </ul>
                    <p v-else class="muted">Nothing right now.</p>
                </section>

                <section class="panel box" aria-labelledby="nu-h">
                    <h2 id="nu-h">Newest sign-ups</h2>
                    <ul class="attn">
                        <li v-for="u in ov.recentUsers" :key="u.email">
                            <span class="nu-row"><b>{{ u.name }}</b><span class="muted small">{{ formatWhen(u.createdAt) }}</span></span>
                            <span class="muted">{{ u.email }}<template v-if="u.siteName"> · <NuxtLink v-if="u.siteId" :to="`/sites/${u.siteId}`">{{ u.siteName }}</NuxtLink><template v-else>{{ u.siteName }}</template></template></span>
                        </li>
                    </ul>
                </section>
            </div>

            <section class="panel box" aria-labelledby="ri-h">
                <div class="ri-head">
                    <h2 id="ri-h">Registered interest <span class="muted">{{ interest.length }}</span></h2>
                    <span class="row">
                        <NuxtLink v-if="comingSoon" class="btn btn-ghost btn-sm" to="/">See the coming-soon page</NuxtLink>
                        <a v-if="interest.length" class="btn btn-ghost btn-sm" href="/api/admin/interest?format=csv" download>Download CSV</a>
                    </span>
                </div>
                <p class="muted small">{{ comingSoon ? 'The home page is showing “coming soon”. People who leave their email appear here, and you get an email for each one.' : 'The full home page is live, so no new sign-ups come in here.' }}</p>
                <ul v-if="interest.length" class="attn">
                    <li v-for="p in interestShown" :key="p.id">
                        <span class="nu-row"><b>{{ p.name ?? p.email }}</b><span class="row"><span class="muted small">{{ formatWhen(p.createdAt) }}</span><button class="btn btn-plain btn-sm" type="button" :aria-label="`Remove ${p.email}`" @click="removeInterest(p.id)">Remove</button></span></span>
                        <span class="muted"><template v-if="p.name">{{ p.email }}</template><template v-if="p.business">{{ p.name ? ' · ' : '' }}{{ p.business }}</template></span>
                    </li>
                </ul>
                <button v-if="interest.length > 8" class="btn btn-plain btn-sm" type="button" @click="showAllInterest = !showAllInterest">{{ showAllInterest ? 'Show fewer' : `Show all ${interest.length}` }}</button>
                <p v-if="!interest.length" class="muted">No one yet.</p>
            </section>

            <div class="list-head">
                <h2>All sites <span class="muted">{{ data?.totals.sites ?? 0 }}</span></h2>
                <div class="seg" role="group" aria-label="Filter by plan">
                    <button v-for="f in (['all', 'active', 'trial', 'expired', 'comped'] as const)" :key="f" type="button" :class="{ on: statusFilter === f }" :aria-pressed="statusFilter === f" @click="statusFilter = f">{{ f === 'all' ? 'All' : statusName[f] }}</button>
                </div>
            </div>

            <label class="search">
                <span class="visually-hidden">Search sites</span>
                <input v-model="search" class="inp" type="search" placeholder="Search by site, address or owner">
            </label>

            <section class="panel scroll" aria-label="All sites">
                <table class="tbl">
                    <thead><tr><th scope="col">Site</th><th scope="col">Owner</th><th scope="col">Plan</th><th scope="col">Pages</th><th scope="col">Created</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
                    <tbody>
                        <tr v-for="s in shown" :key="s.id" :class="{ deleted: s.deletedAt }">
                            <td>
                                <span class="site">
                                    <span class="badge" aria-hidden="true">{{ s.name[0] }}</span>
                                    <span class="site-text">
                                        <span class="name-row">
                                            <NuxtLink v-if="!s.deletedAt" class="rl" :to="`/sites/${s.id}`">{{ s.name }}</NuxtLink>
                                            <b v-else>{{ s.name }}</b>
                                            <span v-if="s.deletedAt" class="flag del">Deleted {{ formatWhen(s.deletedAt) }}</span>
                                            <span v-else-if="s.offline" class="flag">Offline</span>
                                        </span>
                                        <a class="muted" :href="linkFor(s.address)" target="_blank" rel="noopener">{{ s.address }}</a>
                                    </span>
                                </span>
                            </td>
                            <td><span class="site-text"><span>{{ s.ownerName ?? 'No owner' }}</span><span class="muted">{{ s.ownerEmail }}</span></span></td>
                            <td><span class="plan-tag" :class="s.billing.status">{{ s.billing.plan ?? statusName[s.billing.status] }}</span></td>
                            <td>{{ s.pageCount }}</td>
                            <td class="muted">{{ formatWhen(s.createdAt) }}</td>
                            <td class="actions">
                                <button v-if="s.deletedAt" class="btn btn-ghost btn-sm" type="button" @click="restore(s.id)">Restore</button>
                                <template v-else>
                                    <NuxtLink class="btn btn-ghost btn-sm" :to="`/admin/billing?site=${s.id}`">Billing</NuxtLink>
                                    <NuxtLink class="btn btn-dark btn-sm" :to="`/sites/${s.id}`">Open</NuxtLink>
                                </template>
                            </td>
                        </tr>
                        <tr v-if="!shown.length"><td colspan="6" class="muted">No sites match.</td></tr>
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</template>

<style scoped>
.top { align-items: center; background: var(--white); border-bottom: 1px solid var(--line); display: flex; gap: 14px; padding: 14px 24px; }
.home-link { text-decoration: none; }
.tag { background: var(--lichen); border-radius: 999px; color: var(--quarry); font-size: 12px; font-weight: 700; padding: 3px 10px; }
.spacer { flex: 1; }
.who { color: var(--text-muted); font-size: 14px; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 32px 24px 56px; }
.head { display: flex; flex-direction: column; gap: 6px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.big { font-size: 15px; margin: 0; }
.search { max-width: 420px; }
.scroll { overflow-x: auto; }
.site { align-items: center; display: flex; gap: 12px; }
.badge { align-items: center; background: var(--heather); border-radius: var(--radius); color: var(--white); display: flex; flex: none; font-weight: 800; height: 34px; justify-content: center; width: 34px; }
.site-text { display: flex; flex-direction: column; gap: 2px; }
.rl { color: var(--quarry); font-weight: 700; text-decoration: none; }
.rl:hover { text-decoration: underline; }
.actions { text-align: right; }
.name-row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.flag { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 12px; font-weight: 700; padding: 2px 8px; }
.flag.del { background: #fbeceb; color: var(--danger); }
tr.deleted td { opacity: .75; }
.kpis { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); list-style: none; margin: 0; padding: 0; }
.kpi { display: flex; flex-direction: column; gap: 4px; padding: 16px 18px; }
.kpi span { color: var(--text-muted); font-size: 13px; font-weight: 700; }
.kpi b { font-size: 30px; font-weight: 800; letter-spacing: -.03em; line-height: 1.1; }
.kpi small { color: var(--text-body); font-size: 13px; }
.kpi.hi { background: var(--quarry); color: var(--white); }
.kpi.hi span, .kpi.hi small { color: #c3c8d1; }
.ri-head { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; }
.ri-head .row, .nu-row .row { align-items: center; display: inline-flex; gap: 8px; }
.dash { display: grid; gap: 20px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.box { display: flex; flex-direction: column; gap: 14px; padding: 18px 20px; }
h2 { font-size: 17px; margin: 0; }
.bars { align-items: flex-end; display: flex; gap: 3px; height: 120px; }
.bar { background: var(--quarry); border-radius: 3px 3px 0 0; flex: 1; min-width: 3px; }
.bar.zero { background: var(--mist); }
.bar-axis { display: flex; font-size: 12px; justify-content: space-between; }
.plan-bars { display: flex; flex-direction: column; gap: 10px; list-style: none; margin: 0; padding: 0; }
.plan-bars li { align-items: center; display: grid; gap: 10px; grid-template-columns: 150px 1fr 36px; }
.plan-bars b { text-align: right; }
.pb-label { font-size: 14px; }
.pb-track { background: var(--mist); border-radius: 999px; height: 10px; overflow: hidden; }
.pb-fill { background: var(--quarry); border-radius: 999px; display: block; height: 100%; }
.pb-fill.trial { background: #8a94a8; }
.pb-fill.business { background: var(--lichen); }
.pb-fill.studio { background: #5b5773; }
.pb-fill.expired { background: #e3b2ac; }
.attn { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }
.attn li { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 2px; padding: 10px 0; }
.attn li:first-child { border-top: 0; padding-top: 0; }
.nu-row { display: flex; gap: 10px; justify-content: space-between; }
.small { font-size: 13px; }
.list-head { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; margin-top: 8px; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; height: 32px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.plan-tag { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
.plan-tag.active { background: #e8f3ec; color: var(--ok-text); }
.plan-tag.trial { background: #eef1f7; color: #3b4a6b; }
.plan-tag.expired, .plan-tag.past_due { background: #fbeceb; color: var(--danger); }
@media (max-width: 900px) { .dash { grid-template-columns: minmax(0, 1fr); } .plan-bars li { grid-template-columns: 110px 1fr 30px; } }
.kpi-link { color: inherit; display: flex; flex-direction: column; gap: 4px; text-decoration: none; }
.attn-link { color: var(--quarry); text-decoration: none; }
.attn-link:hover { text-decoration: underline; }
.attn .k-p1 b { color: var(--danger); }
</style>
