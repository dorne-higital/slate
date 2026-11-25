<script setup lang="ts">
// Search for a domain and buy it through Slate (yearly, paid via Stripe, registered at name.com).
const props = defineProps<{ siteId: string, canBuy: boolean, suggestion?: string, autoSearch?: boolean }>()
const route = useRoute()

interface Order { id: string, domain: string, price: number, status: DomainOrderStatus, simulated: boolean, expiresAt: string | null, createdAt: string }

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
</style>
