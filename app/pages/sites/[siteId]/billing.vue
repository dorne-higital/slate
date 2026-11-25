<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)

interface BillingPage {
    billing: BillingSummary
    sitesUsed: number
    card: { brand: string, last4: string, expMonth: number, expYear: number } | null
    details: { name: string, address: string, taxId: string } | null
    nextPayment?: { amount: number | null, date: string | null } | null
    invoices: { id: string, date: string, description: string, amount: number, status: string, pdf: string | null, url: string | null }[]
}

const { data: fetched, refresh } = await useAsyncData(`billing-${siteId}`, () => useRequestFetch()<BillingPage>(`/api/sites/${siteId}/billing`))
const { me } = useMe()

// Platform admins never pay, so they can preview what a customer sees with sample data
const preview = ref<'off' | 'trial' | 'paying' | 'expired'>('off')
const day = 86400000
const sample = computed<BillingPage | null>(() => {
    if (preview.value === 'off') return null
    const business = findPlan('business')!
    const paying = preview.value === 'paying'
    return {
        billing: {
            status: preview.value === 'paying' ? 'active' : preview.value,
            plan: paying ? 'business' : null,
            interval: paying ? 'month' : null,
            trialEndsAt: new Date(Date.now() + (preview.value === 'trial' ? 4 : -2) * day).toISOString(),
            currentPeriodEnd: paying ? new Date(Date.now() + 12 * day).toISOString() : null,
            cancelAtPeriodEnd: false,
            limits: business.limits,
            payerName: 'Sample customer',
            youPay: true,
            specialPrice: null
        },
        sitesUsed: 1,
        card: paying ? { brand: 'visa', last4: '4417', expMonth: 8, expYear: 2028 } : null,
        details: paying ? { name: 'Bramble & Oak Upholstery Ltd', address: 'Unit 4, Mead Street, Bristol, BS3 4RP', taxId: '' } : null,
        nextPayment: paying ? { amount: business.monthly, date: new Date(Date.now() + 12 * day).toISOString() } : null,
        invoices: paying ? [0, 1, 2].map(i => ({ id: `in_${i}`, date: new Date(Date.now() - (18 + i * 30) * day).toISOString(), description: 'Business plan, monthly', amount: business.monthly, status: 'paid', pdf: null, url: null })) : []
    }
})
const data = computed(() => sample.value ?? fetched.value)
const invTable = useDataTable(() => data.value?.invoices ?? [], {
    sorters: { date: i => i.date, description: i => i.description, amount: i => i.amount, status: i => i.status },
    initialSort: { key: 'date', dir: 'desc' },
    pageSize: 10
})
useHead({ title: 'Billing · Slate' })

// Back from Stripe Checkout: pull the new subscription straight away
const justPaid = ref(route.query.done === '1')
onMounted(async () => {
    if (!justPaid.value) return
    await $fetch(`/api/sites/${siteId}/billing/sync`, { method: 'POST' }).catch(() => {})
    await refresh()
    await useMe().refresh()
    navigateTo({ query: {} }, { replace: true })
})

const b = computed(() => data.value?.billing)
const interval = ref<BillingInterval>(b.value?.interval ?? 'month')
const showPlans = ref(false)
const busy = ref<string | null>(null)
const error = ref('')
const current = computed(() => findPlan(b.value?.plan))
const daysLeft = computed(() => b.value?.trialEndsAt ? Math.max(0, Math.ceil((new Date(b.value.trialEndsAt).getTime() - Date.now()) / 86400000)) : 0)
const date = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
const features = (p: PlanInfo) => planFeatures(p)

async function go(path: 'checkout' | 'portal', body?: Record<string, string>) {
    if (preview.value !== 'off') {
        error.value = 'This is a preview. In the real page this opens Stripe.'
        return
    }
    busy.value = body?.plan ?? path
    error.value = ''
    try {
        const { url } = await $fetch<{ url: string }>(`/api/sites/${siteId}/billing/${path}`, { method: 'POST', body })
        window.location.href = url
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t work. Please try again.'
        busy.value = null
    }
}
const choose = (plan: PlanKey) => go('checkout', { plan, interval: interval.value })
const special = computed(() => b.value?.specialPrice ?? null)
const chooseSpecial = () => special.value && go('checkout', { plan: special.value.plan, interval: special.value.interval })
const manage = () => go('portal')
const hasSubscription = computed(() => b.value?.status === 'active' || b.value?.status === 'past_due')
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Billing</h1>
            <div v-if="me?.isPlatformAdmin" class="seg" role="group" aria-label="Preview the customer view">
                <span class="seg-label">Preview</span>
                <button v-for="p in (['off', 'trial', 'paying', 'expired'] as const)" :key="p" type="button" :class="{ on: preview === p }" :aria-pressed="preview === p" @click="preview = p; error = ''">{{ { off: 'This site', trial: 'On trial', paying: 'Paying', expired: 'Trial ended' }[p] }}</button>
            </div>
        </div>
        <p v-if="preview !== 'off'" class="note">Preview with sample data. This is what a customer sees; nothing here is real.</p>
        <p v-if="justPaid" class="ok-box" role="status">Thanks. Your plan is being set up; this page updates in a moment.</p>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <template v-if="b">
            <!-- No bill -->
            <section v-if="b.status === 'comped'" class="panel box">
                <h2>No plan needed</h2>
                <p class="muted">This site is looked after by Slate, so there’s nothing to pay.</p>
            </section>

            <!-- Someone else pays -->
            <section v-else-if="!b.youPay" class="panel box">
                <h2>Your plan</h2>
                <p class="muted">This site is on {{ b.payerName ?? 'the owner' }}’s {{ current?.name ?? (b.status === 'trial' ? 'free trial' : 'account') }}. Only they can change the plan.</p>
            </section>

            <template v-else>
                <div class="two">
                    <section class="panel box" aria-labelledby="plan-h">
                        <div class="plan-top">
                            <div>
                                <h2 id="plan-h" class="eyebrow">Your plan</h2>
                                <b class="plan-name">{{ b.status === 'trial' ? 'Free trial' : current?.name ?? 'No plan' }}</b>
                                <span v-if="current && hasSubscription" class="muted">{{ formatPence(b.interval === 'year' ? current.yearly : current.monthly) }} a {{ b.interval === 'year' ? 'year' : 'month' }}</span>
                            </div>
                            <button v-if="hasSubscription" class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="manage">Change plan</button>
                            <button v-else class="btn btn-dark btn-sm" type="button" @click="showPlans = true">Choose a plan</button>
                        </div>

                        <p v-if="b.status === 'trial'" class="note">
                            {{ daysLeft === 0 ? 'Your trial ends today.' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left of your free trial` }}, with everything in Business. Choose a plan before {{ date(b.trialEndsAt) }} to keep your site online.
                        </p>
                        <p v-else-if="b.status === 'expired'" class="note warn">Your site is paused, so visitors can’t see it. Choose a plan to put it back online straight away. Nothing has been deleted.</p>
                        <p v-else-if="b.status === 'past_due'" class="note warn">Your last payment didn’t go through. Update your card so your site stays online.</p>
                        <p v-else-if="b.cancelAtPeriodEnd" class="note warn">Your plan ends on {{ date(b.currentPeriodEnd) }} and your site will go offline then. Change plan to keep it.</p>
                        <p v-else-if="data?.nextPayment?.date" class="muted">Next payment<template v-if="data.nextPayment.amount"> of {{ formatPence(data.nextPayment.amount) }}</template> on {{ date(data.nextPayment.date) }}.</p>

                        <ul v-if="current && hasSubscription" class="feats">
                            <li v-for="f in features(current)" :key="f">{{ f }}</li>
                        </ul>
                        <div v-if="b.limits.sites > 1 || b.limits.extraSiteMonthly" class="sites-used">
                            <span class="muted small">{{ data?.sitesUsed }} of {{ b.limits.sites }} included sites used<template v-if="(data?.sitesUsed ?? 0) > b.limits.sites">, plus {{ (data?.sitesUsed ?? 0) - b.limits.sites }} extra at {{ formatPence(extraSitePrice(b.interval ?? 'month')) }} a {{ b.interval === 'year' ? 'year' : 'month' }} each</template>.</span>
                            <NuxtLink to="/sites" class="btn btn-ghost btn-sm">Add a site</NuxtLink>
                        </div>
                    </section>

                    <div class="col">
                        <section v-if="data?.card || hasSubscription" class="panel box" aria-labelledby="pm-h">
                            <h2 id="pm-h">Payment method</h2>
                            <div class="row-between">
                                <span v-if="data?.card" class="card"><b class="brand">{{ data.card.brand.toUpperCase() }}</b> ending {{ data.card.last4 }} <span class="muted">· expires {{ String(data.card.expMonth).padStart(2, '0') }}/{{ data.card.expYear }}</span></span>
                                <span v-else class="muted">No card saved</span>
                                <button class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="manage">Change</button>
                            </div>
                        </section>
                        <section v-if="data?.details && (data.details.name || data.details.address)" class="panel box" aria-labelledby="bd-h">
                            <h2 id="bd-h">Billing details</h2>
                            <div class="row-between">
                                <span class="details">
                                    <b>{{ data.details.name }}</b>
                                    <span v-if="data.details.address" class="muted">{{ data.details.address }}</span>
                                    <span v-if="data.details.taxId" class="muted">VAT number: {{ data.details.taxId }}</span>
                                </span>
                                <button class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="manage">Edit details</button>
                            </div>
                        </section>
                    </div>
                </div>

                <section v-if="special && !hasSubscription" class="panel box special" aria-labelledby="sp-h">
                    <h2 id="sp-h">Your price</h2>
                    <p>You have a special price: <b>{{ findPlan(special.plan)?.name }} plan, {{ formatPence(special.amount) }} a {{ special.interval }}</b>.</p>
                    <button class="btn btn-dark self-start" type="button" :disabled="!!busy" @click="chooseSpecial">{{ busy === special.plan ? 'Opening checkout…' : `Start ${findPlan(special.plan)?.name} at ${formatPence(special.amount)} a ${special.interval}` }}</button>
                </section>
                <p v-else-if="special && hasSubscription" class="note">You’re on a special price: {{ formatPence(special.amount) }} a {{ special.interval }}.</p>

                <section v-if="showPlans || !hasSubscription" class="plans" aria-labelledby="plans-h">
                    <div class="row-between">
                        <h2 id="plans-h">Choose a plan</h2>
                        <div class="seg" role="group" aria-label="Billing period">
                            <button type="button" :class="{ on: interval === 'month' }" :aria-pressed="interval === 'month'" @click="interval = 'month'">Monthly</button>
                            <button type="button" :class="{ on: interval === 'year' }" :aria-pressed="interval === 'year'" @click="interval = 'year'">Yearly, 2 months free</button>
                        </div>
                    </div>
                    <div class="plan-grid">
                        <div v-for="p in PLANS" :key="p.key" class="panel plan" :class="{ hi: p.key === 'business' }">
                            <b class="plan-card-name">{{ p.name }}</b>
                            <span class="muted">{{ p.tagline }}</span>
                            <span class="price">{{ formatPence(interval === 'year' ? p.yearly : p.monthly) }}<small> a {{ interval === 'year' ? 'year' : 'month' }}</small></span>
                            <ul class="feats">
                                <li v-for="f in features(p)" :key="f">{{ f }}</li>
                            </ul>
                            <button class="btn" :class="p.key === 'business' ? 'btn-dark' : 'btn-ghost'" type="button" :disabled="!!busy || (p.key !== 'studio' && (data?.sitesUsed ?? 1) > 1)" @click="choose(p.key)">
                                {{ busy === p.key ? 'Opening checkout…' : `Choose ${p.name}` }}
                            </button>
                            <span v-if="p.key !== 'studio' && (data?.sitesUsed ?? 1) > 1" class="muted small">You have {{ data?.sitesUsed }} sites, so you need Studio.</span>
                        </div>
                    </div>
                    <p class="muted small">Payments are handled securely by Stripe. Cancel any time; your site stays online until the end of the period you’ve paid for.</p>
                </section>

                <section v-if="data?.invoices.length" class="panel" aria-labelledby="inv-h">
                    <div class="ph"><h2 id="inv-h">Invoices</h2></div>
                    <div class="scroll">
                        <table class="tbl">
                            <thead><tr><SortTh :table="invTable" col="date" label="Date" /><SortTh :table="invTable" col="description" label="Description" /><SortTh :table="invTable" col="amount" label="Amount" /><SortTh :table="invTable" col="status" label="Status" /><th scope="col"><span class="visually-hidden">Download</span></th></tr></thead>
                            <tbody>
                                <tr v-for="i in invTable.rows" :key="i.id">
                                    <td>{{ new Date(i.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}</td>
                                    <td>{{ i.description }}</td>
                                    <td>{{ formatPence(i.amount) }}</td>
                                    <td>{{ i.status === 'paid' ? 'Paid' : i.status === 'open' ? 'Due' : i.status }}</td>
                                    <td class="end"><a v-if="i.pdf" :href="i.pdf" target="_blank" rel="noopener">Download PDF</a></td>
                                </tr>
                            </tbody>
                        </table>
                        <TablePager :table="invTable" noun="invoices" />
                    </div>
                </section>

                <button v-if="hasSubscription && !b.cancelAtPeriodEnd" class="btn btn-plain danger self-start" type="button" :disabled="!!busy" @click="manage">Cancel subscription</button>
            </template>
        </template>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.eyebrow { color: var(--text-muted); font-size: 14px; font-weight: 700; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
.col { display: flex; flex-direction: column; gap: 24px; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.plan-top { align-items: flex-start; display: flex; gap: 12px; justify-content: space-between; }
.plan-top > div { display: flex; flex-direction: column; gap: 4px; }
.plan-name { font-size: 28px; font-weight: 800; letter-spacing: -.02em; }
.note { background: var(--paper); border-radius: var(--radius); font-size: 14px; line-height: 1.5; margin: 0; padding: 12px 14px; }
.note.warn { background: #fbeceb; color: var(--danger); }
.ok-box { background: #e8f3ec; border-radius: var(--radius); color: var(--ok-text); margin: 0; padding: 12px 14px; }
.feats { display: flex; flex-direction: column; gap: 6px; list-style: none; margin: 0; padding: 0; }
.feats li { font-size: 14px; padding-left: 22px; position: relative; }
.feats li::before { color: var(--ok); content: '✓'; font-weight: 800; left: 0; position: absolute; }
.row-between { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.brand { background: var(--mist); border-radius: 4px; font-size: 12px; margin-right: 6px; padding: 2px 6px; }
.details { display: flex; flex-direction: column; gap: 2px; }
.small { font-size: 13px; margin: 0; }
.plans { display: flex; flex-direction: column; gap: 16px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.seg-label { align-self: center; color: var(--text-muted); font-size: 13px; font-weight: 700; padding: 0 6px; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.plan-grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.plan { display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.plan.hi { box-shadow: 0 0 0 2px var(--quarry); }
.plan-card-name { font-size: 20px; }
.price { font-size: 30px; font-weight: 800; letter-spacing: -.02em; }
.price small { color: var(--text-muted); font-size: 14px; font-weight: 600; letter-spacing: 0; }
.plan .btn { margin-top: auto; }
.ph { padding: 16px 20px; }
.scroll { overflow-x: auto; }
.end { text-align: right; }
.danger { color: var(--danger); }
.self-start { align-self: flex-start; }
@media (max-width: 1000px) { .two { grid-template-columns: minmax(0, 1fr); } }
.sites-used { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; }
.special { box-shadow: 0 0 0 2px var(--lichen); }
.self-start { align-self: flex-start; }
</style>
