<script setup lang="ts">
// Special prices, one-off invoices and discount codes. Platform admins only (the API answers 404 to anyone else).
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const router = useRouter()
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Billing · Slate admin' })
const fetcher = useRequestFetch()
const errMsg = (err: unknown, fallback: string) => (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? fallback

interface InvoiceRow { id: string, siteId: string | null, siteName?: string | null, number: string | null, description: string, total: number, status: string, hostedUrl: string | null, pdfUrl: string | null, dueAt: string | null, createdAt: string }
interface Discount { id: string, code: string, active: boolean, used: number, maxUses: number | null, expiresAt: string | null, percentOff: number | null, amountOff: number | null, duration: 'once' | 'forever' | 'repeating', months: number | null }
interface SiteBilling { site: { id: string, name: string }, billTo: { name: string, email: string, isPayer: boolean } | null, billing: BillingSummary, invoices: InvoiceRow[] }

const [{ data: sites }, { data: invoices, refresh: refreshInvoices }, { data: discounts, refresh: refreshDiscounts }] = await Promise.all([
    useAsyncData('admin-billing-sites', () => fetcher<{ sites: { id: string, name: string, deletedAt: string | null, ownerEmail: string | null }[] }>('/api/admin/sites').then(r => r.sites.filter(s => !s.deletedAt))),
    useAsyncData('admin-invoices', () => fetcher<InvoiceRow[]>('/api/admin/billing/invoices')),
    useAsyncData('admin-discounts', () => fetcher<Discount[]>('/api/admin/billing/discounts').catch(() => [] as Discount[]))
])

// ── Chosen site ──
const siteId = ref(String(route.query.site ?? ''))
const chosen = ref<SiteBilling | null>(null)
async function loadSite() {
    chosen.value = null
    if (!siteId.value) return
    router.replace({ query: { site: siteId.value } })
    chosen.value = await $fetch<SiteBilling>(`/api/admin/billing/sites/${siteId.value}`).catch(() => null)
    const sp = chosen.value?.billing.specialPrice
    price.plan = sp?.plan ?? 'business'
    price.interval = sp?.interval ?? 'month'
    price.pounds = sp ? String(sp.amount / 100) : ''
}
const statusName: Record<BillingStatus, string> = { comped: 'Slate covers it', trial: 'On free trial', active: 'Paying', past_due: 'Payment failed', expired: 'Paused' }
const pence = (pounds: string | number) => Math.round(Number(String(pounds).replace(/[£,\s]/g, '')) * 100)
const date = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

// ── Special price ──
const price = reactive({ plan: 'business' as PlanKey, interval: 'month' as BillingInterval, pounds: '' })
const listPrice = computed(() => { const p = findPlan(price.plan)!; return price.interval === 'month' ? p.monthly : p.yearly })
const priceMsg = ref('')
const priceErr = ref('')
const savingPrice = ref(false)
async function savePrice() {
    priceErr.value = ''
    priceMsg.value = ''
    savingPrice.value = true
    try {
        const r = await $fetch<{ billTo: string }>(`/api/admin/billing/sites/${siteId.value}/price`, { method: 'PUT', body: { plan: price.plan, interval: price.interval, amount: pence(price.pounds) } })
        priceMsg.value = `Saved. ${r.billTo} pays ${formatPence(pence(price.pounds))} a ${price.interval} from their next payment, or when they start their plan in Billing.`
        await loadSite()
    } catch (err) {
        priceErr.value = errMsg(err, 'Couldn’t save the price. Try again.')
    } finally {
        savingPrice.value = false
    }
}
async function clearPrice() {
    priceErr.value = ''
    try {
        await $fetch(`/api/admin/billing/sites/${siteId.value}/price`, { method: 'DELETE' })
        priceMsg.value = 'Back to the normal price from their next payment.'
        await loadSite()
    } catch (err) {
        priceErr.value = errMsg(err, 'Couldn’t remove the price. Try again.')
    }
}

// ── Invoice ──
const inv = reactive({ lines: [{ description: '', pounds: '' }], days: 14, note: '' })
const invTotal = computed(() => inv.lines.reduce((n, l) => n + (pence(l.pounds) || 0), 0))
const invErr = ref('')
const invMsg = ref('')
const sending = ref(false)
const confirmSend = ref(false)
async function sendInvoice() {
    invErr.value = ''
    sending.value = true
    try {
        const r = await $fetch<InvoiceRow>('/api/admin/billing/invoices', { method: 'POST', body: { siteId: siteId.value, items: inv.lines.map(l => ({ description: l.description, amount: pence(l.pounds) })), daysUntilDue: inv.days, note: inv.note } })
        invMsg.value = `Invoice ${r.number ?? ''} for ${formatPence(r.total)} sent to ${chosen.value?.billTo?.email}.`
        inv.lines = [{ description: '', pounds: '' }]
        inv.note = ''
        confirmSend.value = false
        await Promise.all([loadSite(), refreshInvoices()])
    } catch (err) {
        invErr.value = errMsg(err, 'Couldn’t create the invoice. Try again.')
        confirmSend.value = false
    } finally {
        sending.value = false
    }
}
const voiding = ref<string | null>(null)
async function voidInvoice(id: string) {
    await $fetch(`/api/admin/billing/invoices/${id}/void`, { method: 'POST' }).catch(() => {})
    voiding.value = null
    await Promise.all([loadSite(), refreshInvoices()])
}
const statusLook: Record<string, string> = { open: 'Unpaid', paid: 'Paid', void: 'Cancelled', uncollectible: 'Written off', draft: 'Draft' }

// ── Discount codes ──
const disc = reactive({ code: '', kind: 'percent' as 'percent' | 'amount', value: '', duration: 'once' as 'once' | 'forever' | 'repeating', months: 3, maxUses: '', expiresOn: '' })
const discErr = ref('')
const discMsg = ref('')
const makingDisc = ref(false)
async function makeDiscount() {
    discErr.value = ''
    discMsg.value = ''
    makingDisc.value = true
    try {
        const d = await $fetch<Discount>('/api/admin/billing/discounts', { method: 'POST', body: { code: disc.code, kind: disc.kind, value: disc.kind === 'amount' ? pence(disc.value) : Number(disc.value), duration: disc.duration, months: disc.months, maxUses: disc.maxUses ? Number(disc.maxUses) : null, expiresOn: disc.expiresOn || null } })
        discMsg.value = `${d.code} is ready. People enter it when they choose a plan.`
        disc.code = ''
        disc.value = ''
        disc.maxUses = ''
        disc.expiresOn = ''
        await refreshDiscounts()
    } catch (err) {
        discErr.value = errMsg(err, 'Couldn’t make the code. Try again.')
    } finally {
        makingDisc.value = false
    }
}
async function stopDiscount(id: string) {
    await $fetch(`/api/admin/billing/discounts/${id}`, { method: 'DELETE' }).catch(() => {})
    await refreshDiscounts()
}
const discountText = (d: Discount) => {
    const off = d.percentOff ? `${d.percentOff}% off` : `${formatPence(d.amountOff ?? 0)} off`
    const how = d.duration === 'forever' ? 'every payment' : d.duration === 'once' ? 'the first payment' : `${d.months} months`
    return `${off} ${how}`
}
watch(siteId, loadSite)
if (siteId.value) await loadSite()
const randomCode = () => { disc.code = `SLATE-${Math.random().toString(36).slice(2, 7).toUpperCase()}` }
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <h1>Billing</h1>
                <p class="muted">Special prices and invoices for a site’s client, and discount codes anyone can use. Everything goes through Stripe.</p>
            </div>

            <section class="panel box" aria-labelledby="site-h">
                <h2 id="site-h">A client’s site</h2>
                <div class="field">
                    <label for="pick-site">Site</label>
                    <select id="pick-site" v-model="siteId" class="inp">
                        <option value="">Choose a site…</option>
                        <option v-for="s in sites" :key="s.id" :value="s.id">{{ s.name }}{{ s.ownerEmail ? ` (${s.ownerEmail})` : '' }}</option>
                    </select>
                </div>

                <template v-if="chosen">
                    <p v-if="!chosen.billTo" class="note">Only platform admins own this site, and Slate never bills admins, so it’s free. To bill a client for it, invite them as an owner on the site’s People page. They’ll then be the one who pays.</p>
                    <div v-else class="who">
                        <span><b>{{ chosen.billTo.name }}</b> · {{ chosen.billTo.email }}</span>
                        <span class="muted">{{ statusName[chosen.billing.status] }}{{ chosen.billing.plan ? `, ${findPlan(chosen.billing.plan)?.name} ${chosen.billing.interval === 'year' ? 'yearly' : 'monthly'}` : '' }}{{ chosen.billing.specialPrice ? `, special price ${formatPence(chosen.billing.specialPrice.amount)} a ${chosen.billing.specialPrice.interval}` : '' }}</span>
                        <span v-if="!chosen.billTo.isPayer" class="note">Slate covers this site at the moment. Setting a price makes {{ chosen.billTo.name }} the payer, with a 14-day trial, and they start their plan at your price from the site’s Billing page.</span>
                    </div>

                    <div v-if="chosen.billTo" class="two">
                        <form class="sub" @submit.prevent="savePrice">
                            <h3>Special price</h3>
                            <p class="muted small">Replaces the normal plan price for this client, from their next payment. Plan limits stay the same.</p>
                            <div class="row3">
                                <div class="field"><label for="sp-plan">Plan</label><select id="sp-plan" v-model="price.plan" class="inp"><option v-for="p in PLANS" :key="p.key" :value="p.key">{{ p.name }}</option></select></div>
                                <div class="field"><label for="sp-int">Paid</label><select id="sp-int" v-model="price.interval" class="inp"><option value="month">Monthly</option><option value="year">Yearly</option></select></div>
                                <div class="field"><label for="sp-amt">Price (£)</label><input id="sp-amt" v-model="price.pounds" class="inp" inputmode="decimal" placeholder="e.g. 10" required></div>
                            </div>
                            <span class="help">Normal price: {{ formatPence(listPrice) }} a {{ price.interval }}.</span>
                            <p v-if="priceErr" class="err" role="alert">{{ priceErr }}</p>
                            <p v-if="priceMsg" class="ok" role="status">{{ priceMsg }}</p>
                            <div class="row">
                                <button class="btn btn-dark" type="submit" :disabled="savingPrice || !price.pounds">{{ savingPrice ? 'Saving…' : 'Save price' }}</button>
                                <button v-if="chosen.billing.specialPrice" class="btn btn-plain btn-sm" type="button" @click="clearPrice">Back to normal price</button>
                            </div>
                        </form>

                        <form class="sub" @submit.prevent="confirmSend = true">
                            <h3>New invoice</h3>
                            <p class="muted small">For one-off work. {{ chosen.billTo.name.split(' ')[0] }} gets an email with a link to pay by card. It also shows on their Billing page.</p>
                            <div v-for="(l, i) in inv.lines" :key="i" class="line">
                                <input v-model="l.description" class="inp" placeholder="e.g. New booking page" maxlength="200" :aria-label="`Line ${i + 1} description`">
                                <input v-model="l.pounds" class="inp amt" inputmode="decimal" placeholder="£" :aria-label="`Line ${i + 1} amount in pounds`">
                                <button v-if="inv.lines.length > 1" class="ib" type="button" :aria-label="`Remove line ${i + 1}`" @click="inv.lines.splice(i, 1)">✕</button>
                            </div>
                            <button v-if="inv.lines.length < 20" class="btn btn-ghost btn-sm self-start" type="button" @click="inv.lines.push({ description: '', pounds: '' })">Add a line</button>
                            <div class="row3">
                                <div class="field"><label for="inv-days">Due in (days)</label><input id="inv-days" v-model.number="inv.days" class="inp" type="number" min="0" max="90"></div>
                            </div>
                            <div class="field"><label for="inv-note">Note on the invoice (optional)</label><textarea id="inv-note" v-model="inv.note" class="inp" rows="2" maxlength="500" /></div>
                            <p v-if="invErr" class="err" role="alert">{{ invErr }}</p>
                            <p v-if="invMsg" class="ok" role="status">{{ invMsg }}</p>
                            <button v-if="!confirmSend" class="btn btn-dark self-start" type="submit" :disabled="!invTotal">Review invoice for {{ formatPence(invTotal) }}</button>
                            <div v-else class="confirm" role="alert">
                                <span>Send an invoice for <b>{{ formatPence(invTotal) }}</b> to <b>{{ chosen.billTo.email }}</b>, due in {{ inv.days }} days?</span>
                                <span class="row">
                                    <button class="btn btn-dark btn-sm" type="button" :disabled="sending" @click="sendInvoice">{{ sending ? 'Sending…' : 'Send invoice' }}</button>
                                    <button class="btn btn-plain btn-sm" type="button" @click="confirmSend = false">Back</button>
                                </span>
                            </div>
                        </form>
                    </div>
                </template>
            </section>

            <section class="panel" aria-labelledby="inv-h">
                <div class="ph"><h2 id="inv-h">Invoices sent</h2></div>
                <div class="scroll">
                    <table class="tbl">
                        <thead><tr><th scope="col">Invoice</th><th scope="col">Site</th><th scope="col">For</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
                        <tbody>
                            <tr v-for="i in invoices" :key="i.id">
                                <td><span class="stack"><b>{{ i.number ?? '—' }}</b><span class="muted small">{{ date(i.createdAt) }}</span></span></td>
                                <td>{{ i.siteName ?? '—' }}</td>
                                <td class="desc">{{ i.description }}</td>
                                <td>{{ formatPence(i.total) }}</td>
                                <td><span class="pill" :class="i.status">{{ statusLook[i.status] ?? i.status }}</span><span v-if="i.status === 'open' && i.dueAt" class="muted small"> due {{ date(i.dueAt) }}</span></td>
                                <td class="actions">
                                    <a v-if="i.hostedUrl" :href="i.hostedUrl" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">View</a>
                                    <template v-if="i.status === 'open'">
                                        <button v-if="voiding !== i.id" class="btn btn-plain btn-sm" type="button" @click="voiding = i.id">Cancel…</button>
                                        <button v-else class="btn btn-sm del" type="button" @click="voidInvoice(i.id)">Cancel invoice</button>
                                    </template>
                                </td>
                            </tr>
                            <tr v-if="!invoices?.length"><td colspan="6" class="muted">No invoices yet.</td></tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <section class="panel box" aria-labelledby="disc-h">
                <h2 id="disc-h">Discount codes</h2>
                <p class="muted small">People type a code when they choose a plan in Billing. Switching a code off stops new people using it; anyone already on it keeps their discount.</p>
                <form class="disc-form" @submit.prevent="makeDiscount">
                    <div class="field"><label for="d-code">Code</label><span class="row nowrap"><input id="d-code" v-model="disc.code" class="inp" placeholder="e.g. WELCOME20" maxlength="30" required><button class="btn btn-plain btn-sm" type="button" @click="randomCode">Make one up</button></span></div>
                    <div class="field"><label for="d-kind">Discount</label><span class="row nowrap"><select id="d-kind" v-model="disc.kind" class="inp short"><option value="percent">% off</option><option value="amount">£ off</option></select><input v-model="disc.value" class="inp short" inputmode="decimal" :placeholder="disc.kind === 'percent' ? '20' : '5'" aria-label="How much off" required></span></div>
                    <div class="field"><label for="d-dur">For</label><span class="row nowrap"><select id="d-dur" v-model="disc.duration" class="inp"><option value="once">The first payment</option><option value="repeating">A number of months</option><option value="forever">Every payment</option></select><input v-if="disc.duration === 'repeating'" v-model.number="disc.months" class="inp short" type="number" min="1" max="36" aria-label="Months"></span></div>
                    <div class="field"><label for="d-max">Uses (optional)</label><input id="d-max" v-model="disc.maxUses" class="inp short" type="number" min="1" placeholder="Any"></div>
                    <div class="field"><label for="d-exp">Ends (optional)</label><input id="d-exp" v-model="disc.expiresOn" class="inp" type="date"></div>
                    <button class="btn btn-dark" type="submit" :disabled="makingDisc">{{ makingDisc ? 'Making…' : 'Make code' }}</button>
                </form>
                <p v-if="discErr" class="err" role="alert">{{ discErr }}</p>
                <p v-if="discMsg" class="ok" role="status">{{ discMsg }}</p>
                <ul class="codes">
                    <li v-for="d in discounts" :key="d.id" :class="{ off: !d.active }">
                        <code>{{ d.code }}</code>
                        <span>{{ discountText(d) }}</span>
                        <span class="muted small">Used {{ d.used }}{{ d.maxUses ? ` of ${d.maxUses}` : '' }}{{ d.expiresAt ? ` · ends ${date(d.expiresAt)}` : '' }}{{ d.active ? '' : ' · switched off' }}</span>
                        <button v-if="d.active" class="btn btn-plain btn-sm" type="button" @click="stopDiscount(d.id)">Switch off</button>
                    </li>
                    <li v-if="!discounts?.length" class="muted">No codes yet.</li>
                </ul>
            </section>
        </main>
    </div>
</template>

<style scoped>
.admin { background: var(--paper); min-height: 100vh; }
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 28px 24px 56px; }
.head p { margin: 6px 0 0; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
h3 { font-size: 16px; margin: 0; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.ph { padding: 16px 20px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; padding: 10px 12px; }
.small { font-size: 13px; }
.who { background: var(--paper); border-radius: var(--radius); display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; }
.note { background: #fff6e5; border-radius: var(--radius); font-size: 14px; margin-top: 6px; padding: 10px 12px; }
.two { align-items: start; display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.sub { border: 1px solid var(--line-soft); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.sub p { margin: 0; }
.row3 { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.nowrap { flex-wrap: nowrap; }
.line { align-items: center; display: flex; gap: 8px; }
.line .inp:first-child { flex: 1; }
.amt { width: 100px; }
.short { width: 110px; }
.ib { background: none; border: 0; border-radius: var(--radius); cursor: pointer; height: 32px; width: 32px; }
.ib:hover { background: var(--mist); }
.self-start { align-self: flex-start; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.ok { color: var(--ok-text); font-size: 14px; margin: 0; }
.confirm { background: var(--paper); border-radius: var(--radius); display: flex; flex-direction: column; gap: 10px; padding: 12px; }
.scroll { overflow-x: auto; }
.stack { display: flex; flex-direction: column; }
.desc { max-width: 320px; }
.pill { border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; background: var(--mist); }
.pill.paid { background: #e8f3ec; color: var(--ok-text); }
.pill.open { background: #fff1d6; color: #7a4b00; }
.actions { text-align: right; white-space: nowrap; }
.del { background: var(--danger); color: var(--white); }
.disc-form { align-items: end; display: flex; flex-wrap: wrap; gap: 12px; }
.codes { list-style: none; margin: 0; padding: 0; }
.codes li { align-items: center; border-top: 1px solid var(--line-soft); display: grid; gap: 12px; grid-template-columns: 160px minmax(0, 1fr) minmax(0, 1fr) auto; padding: 10px 0; }
.codes li.off { opacity: .55; }
.codes code { font-size: 15px; font-weight: 700; }
@media (max-width: 900px) { .two { grid-template-columns: minmax(0, 1fr); } .codes li { grid-template-columns: minmax(0, 1fr); } .row3 { grid-template-columns: minmax(0, 1fr); } }
</style>
