<script setup lang="ts">
// Search for a domain and buy it through Slate (yearly, paid via Stripe, registered at name.com).
const props = defineProps<{ siteId: string, canBuy: boolean, suggestion?: string, autoSearch?: boolean }>()
const route = useRoute()

interface Order { id: string, domain: string, price: number, status: DomainOrderStatus, simulated: boolean, expiresAt: string | null, createdAt: string, canForward?: boolean }

const query = ref(props.suggestion ?? '')
const results = ref<DomainOption[] | null>(null)
const simulated = ref(false)
const searching = ref(false)
const buying = ref<string | null>(null)
const error = ref('')
const { data: orders, refresh } = await useAsyncData(`domain-orders-${props.siteId}`, () => useRequestFetch()<Order[]>(`/api/sites/${props.siteId}/domains/orders`), { default: () => [] })

async function search() {
    searching.value = true
    error.value = ''
    try {
        const res = await $fetch<{ options: DomainOption[], simulated: boolean }>(`/api/sites/${props.siteId}/domains/search`, { method: 'POST', body: { query: query.value } })
        results.value = res.options
        simulated.value = res.simulated
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t search just now. Please try again.'
    } finally {
        searching.value = false
    }
}

async function buy(domain: string) {
    buying.value = domain
    error.value = ''
    try {
        const { url } = await $fetch<{ url: string }>(`/api/sites/${props.siteId}/domains/buy`, { method: 'POST', body: { domain } })
        window.location.href = url
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t start the purchase. Please try again.'
        buying.value = null
    }
}

// Back from Stripe: finish setting the domain up
const returning = typeof route.query.order === 'string' ? route.query.order : null
const emit = defineEmits<{ bought: [] }>()
onMounted(async () => {
    if (props.autoSearch && query.value.trim() && !returning) search()
    if (!returning) return
    await $fetch(`/api/sites/${props.siteId}/domains/orders/${returning}`, { method: 'POST' }).catch(() => {})
    await refresh()
    emit('bought')
    navigateTo({ query: {} }, { replace: true })
})

// Email forwarding (domains with their own Cloudflare zone): hello@theirdomain → their own inbox
interface Forward { id: string, from: string, to: string, confirmed: boolean }
const fwd = reactive<Record<string, { open: boolean, list: Forward[], local: string, to: string, busy: boolean, error: string, loaded: boolean }>>({})
async function toggleForwarding(id: string) {
    if (fwd[id]?.open) {
        fwd[id]!.open = false
        return
    }
    fwd[id] = { open: true, list: fwd[id]?.list ?? [], local: 'hello', to: '', busy: !fwd[id]?.loaded, error: '', loaded: !!fwd[id]?.loaded }
    if (fwd[id]!.loaded) return
    try {
        fwd[id]!.list = await $fetch<Forward[]>(`/api/sites/${props.siteId}/domains/orders/${id}/forwarding`)
        fwd[id]!.loaded = true
    } catch (err) {
        fwd[id]!.error = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t load your forwards. Please try again.'
    } finally {
        fwd[id]!.busy = false
    }
}
async function changeForwarding(id: string, method: 'POST' | 'DELETE', forwardId?: string) {
    const f = fwd[id]!
    f.busy = true
    f.error = ''
    try {
        f.list = await $fetch<Forward[]>(`/api/sites/${props.siteId}/domains/orders/${id}/forwarding`, method === 'POST'
            ? { method, body: { local: f.local, to: f.to } }
            : { method, query: { id: forwardId } })
        if (method === 'POST') f.local = ''
    } catch (err) {
        f.error = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save that. Please try again.'
    } finally {
        f.busy = false
    }
}

// Moving a domain to another registrar: the transfer code, or for .uk names the IPS tag route
const transfer = reactive<Record<string, { busy?: boolean, kind?: 'code' | 'uk' | 'test', code?: string, error?: string }>>({})
async function getTransfer(id: string) {
    transfer[id] = { busy: true }
    try {
        const res = await $fetch<{ kind: 'code' | 'uk' | 'test', code?: string }>(`/api/sites/${props.siteId}/domains/orders/${id}/transfer`, { method: 'POST' })
        transfer[id] = res
    } catch (err) {
        transfer[id] = { error: (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t get the code just now. Please try again.' }
    }
}
const copied = ref('')
async function copy(id: string, code: string) {
    await navigator.clipboard?.writeText(code).catch(() => {})
    copied.value = id
}

const statusText: Record<DomainOrderStatus, string> = {
    pending_payment: 'Waiting for payment',
    registering: 'Registering…',
    active: 'Yours',
    failed: 'Needs our help',
    cancelled: 'Not renewing'
}
</script>

<template>
    <section class="panel buy" aria-labelledby="buy-h">
        <h2 id="buy-h">Buy a domain</h2>
        <ConfirmEmailNote v-if="canBuy" reason="You can search now, but you’ll need to confirm it before buying a domain." />
        <p class="muted big">We register it in your name, connect it to this site and set up HTTPS. Renews every year until you cancel.</p>
        <form class="row" @submit.prevent="search">
            <label class="visually-hidden" for="buy-q">Domain you’d like</label>
            <input id="buy-q" v-model="query" class="inp" type="text" placeholder="yourbusiness" autocomplete="off" autocapitalize="off" spellcheck="false" required>
            <button class="btn btn-dark" type="submit" :disabled="searching">{{ searching ? 'Checking…' : 'Search' }}</button>
        </form>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>
        <p v-if="simulated && results" class="note">Test mode: purchases go through Stripe’s test checkout and nothing is really registered.</p>

        <ul v-if="results" class="results">
            <li v-for="r in results" :key="r.domain" :class="{ off: !r.available }">
                <b class="dn">{{ r.domain }}</b>
                <template v-if="r.available">
                    <span class="price">{{ formatPence(r.price!) }} a year</span>
                    <button v-if="canBuy" class="btn btn-ghost btn-sm" type="button" :disabled="!!buying" @click="buy(r.domain)">{{ buying === r.domain ? 'Opening checkout…' : 'Buy' }}</button>
                </template>
                <span v-else class="muted">{{ r.reason }}</span>
            </li>
        </ul>
        <p v-if="results && !canBuy" class="muted">Only the site’s owner can buy a domain.</p>

        <div v-if="orders.length" class="orders">
            <b>Bought through Slate</b>
            <ul>
                <li v-for="o in orders" :key="o.id">
                    <span class="dn">{{ o.domain }}</span>
                    <span class="tag" :class="o.status">{{ statusText[o.status] }}<template v-if="o.simulated"> (test)</template></span>
                    <span v-if="o.status === 'active' && o.expiresAt" class="muted small">Renews {{ new Date(o.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }} · {{ formatPence(o.price) }}</span>
                    <span v-else-if="o.status === 'failed'" class="muted small">You’ve paid and we’re on it. We’ll finish setting it up and let you know.</span>
                    <button v-if="canBuy && o.canForward" class="btn btn-ghost btn-sm" type="button" :aria-expanded="!!fwd[o.id]?.open" @click="toggleForwarding(o.id)">Email forwarding</button>
                    <button v-if="canBuy && (o.status === 'active' || o.status === 'cancelled') && !transfer[o.id]" class="btn btn-plain btn-sm" type="button" @click="getTransfer(o.id)">Move to another provider</button>
                    <div v-if="fwd[o.id]?.open" class="move fwd">
                        <p><b>Email forwarding</b> sends mail for {{ o.domain }} to an inbox you already have, free. To send as that address too, use your email provider’s “send mail as” setting.</p>
                        <p v-if="fwd[o.id]!.busy && !fwd[o.id]!.loaded" class="muted small">Loading…</p>
                        <ul v-if="fwd[o.id]!.list.length" class="fwd-list">
                            <li v-for="f in fwd[o.id]!.list" :key="f.id">
                                <span><b>{{ f.from === '*' ? `Anything @${o.domain}` : f.from }}</b> → {{ f.to }}</span>
                                <span v-if="f.confirmed" class="tag active">Working</span>
                                <span v-else class="tag">Check {{ f.to }} and press the link from Cloudflare</span>
                                <button class="btn btn-plain btn-sm danger" type="button" :disabled="fwd[o.id]!.busy" @click="changeForwarding(o.id, 'DELETE', f.id)">Remove</button>
                            </li>
                        </ul>
                        <form class="fwd-add" @submit.prevent="changeForwarding(o.id, 'POST')">
                            <label class="sr" :for="`fl-${o.id}`">Address</label>
                            <span class="addr"><input :id="`fl-${o.id}`" v-model="fwd[o.id]!.local" class="inp" type="text" placeholder="hello" autocomplete="off" spellcheck="false"><span>@{{ o.domain }}</span></span>
                            <span aria-hidden="true">→</span>
                            <label class="sr" :for="`ft-${o.id}`">Send to</label>
                            <input :id="`ft-${o.id}`" v-model="fwd[o.id]!.to" class="inp" type="email" placeholder="you@gmail.com" autocomplete="email">
                            <button class="btn btn-dark btn-sm" type="submit" :disabled="fwd[o.id]!.busy || !fwd[o.id]!.local || !fwd[o.id]!.to">{{ fwd[o.id]!.busy && fwd[o.id]!.loaded ? 'Saving…' : 'Add' }}</button>
                        </form>
                        <p class="muted small">Type * as the address to catch anything sent to the domain. The first time you use an inbox, Cloudflare emails it a link to confirm.</p>
                        <p v-if="fwd[o.id]!.error" class="error-box">{{ fwd[o.id]!.error }}</p>
                    </div>
                    <div v-if="transfer[o.id]" class="move" role="status">
                        <template v-if="transfer[o.id]!.busy">Getting your transfer code…</template>
                        <p v-else-if="transfer[o.id]!.error" class="error-box">{{ transfer[o.id]!.error }}</p>
                        <template v-else-if="transfer[o.id]!.kind === 'test'">This was a test purchase, so there’s no real domain to move.</template>
                        <template v-else-if="transfer[o.id]!.kind === 'uk'">
                            <p><b>.uk names move a little differently.</b> There’s no code. Ask your new provider for their <b>IPS tag</b>, then send it to us from Support and we’ll hand the domain over, usually within a working day.</p>
                            <p class="muted small">Once it’s moved, cancel the domain in Billing so we stop renewing it.</p>
                        </template>
                        <template v-else>
                            <p>Give this code to your new provider when they ask for it. We’ve unlocked the domain so the move can go ahead.</p>
                            <div class="code-row"><code>{{ transfer[o.id]!.code }}</code><button class="btn btn-ghost btn-sm" type="button" @click="copy(o.id, transfer[o.id]!.code!)">{{ copied === o.id ? 'Copied' : 'Copy' }}</button></div>
                            <p class="muted small">Your site keeps working while it moves, as long as the new provider keeps the same DNS records. Once it’s moved, cancel the domain in Billing so we stop renewing it.</p>
                        </template>
                    </div>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.buy { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
h2 { font-size: 18px; margin: 0; }
.big { font-size: 15px; margin: 0; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.row .inp { flex: 1 1 240px; font-size: 15px; height: 42px; }
.note { background: var(--paper); border-radius: var(--radius); font-size: 14px; margin: 0; padding: 10px 12px; }
.results, .orders ul { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }
.results li, .orders li { align-items: center; border-top: 1px solid var(--line-soft); display: flex; flex-wrap: wrap; gap: 8px 16px; padding: 10px 0; }
.results li.off .dn { color: var(--text-muted); font-weight: 600; }
.dn { flex: 1; min-width: 180px; overflow-wrap: anywhere; }
.price { font-weight: 700; }
.orders { display: flex; flex-direction: column; gap: 6px; }
.tag { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; padding: 3px 9px; }
.tag.active { background: #e8f3ec; color: var(--ok-text); }
.tag.failed { background: #fbeceb; color: var(--danger); }
.small { font-size: 13px; }
.move { background: var(--paper); border-radius: var(--radius); display: flex; flex: 1 1 100%; flex-direction: column; font-size: 14px; gap: 8px; padding: 12px 14px; }
.move p { margin: 0; }
.code-row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.fwd-list { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }
.fwd-list li { border-top: 0; display: flex; flex-wrap: wrap; gap: 6px 12px; padding: 4px 0; }
.fwd-list li > span:first-child { flex: 1 1 260px; overflow-wrap: anywhere; }
.fwd-add { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.fwd-add .inp { font-size: 14px; height: 36px; }
.fwd-add > .inp { flex: 1 1 200px; }
.addr { align-items: center; display: flex; flex: 1 1 220px; gap: 4px; }
.addr .inp { flex: 1; min-width: 70px; }
.addr span { color: var(--text-muted); font-size: 14px; white-space: nowrap; }
.danger { color: var(--danger); }
.sr { clip: rect(0 0 0 0); height: 1px; overflow: hidden; position: absolute; width: 1px; }
.code-row code { background: var(--white); border-radius: var(--radius); box-shadow: 0 0 0 1px var(--line); font-size: 15px; overflow-wrap: anywhere; padding: 6px 10px; user-select: all; }
</style>
