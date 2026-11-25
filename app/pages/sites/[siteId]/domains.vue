<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()

interface DomainsData {
    freeAddress: string
    mainDomain: string | null
    cnameTarget: string
    domains: { hostname: string, status: 'pending' | 'active' | 'error', detail: string | null, isMain: boolean, checkedAt: string | null, verify: { name: string, value: string } | null }[]
}

const { data, error: loadError, refresh: refreshDomains } = await useAsyncData(`domains-${siteId}`, () => fetcher<DomainsData>(`/api/sites/${siteId}/domains`))
const { me } = useMe()
const isOwner = computed(() => me.value?.sites.find(x => x.id === siteId)?.role === 'owner')
useHead({ title: 'Domains · Slate' })

const adding = ref(false)
const newDomain = ref('')
const busy = ref<string | null>(null)
const error = ref('')
const copied = ref<string | null>(null)

// Group www.x and x together, main domain first
const groups = computed(() => {
    const map = new Map<string, DomainsData['domains']>()
    for (const d of data.value?.domains ?? []) {
        const key = d.hostname.replace(/^www\./, '')
        map.set(key, [...(map.get(key) ?? []), d])
    }
    return [...map.entries()]
        .map(([root, list]) => ({ root, list: list.sort((a, b) => a.hostname.length - b.hostname.length) }))
        .sort((a, b) => Number(b.list.some(d => d.isMain)) - Number(a.list.some(d => d.isMain)))
})

async function run(key: string, fn: () => Promise<DomainsData>) {
    busy.value = key
    error.value = ''
    try {
        data.value = await fn()
        return true
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Something went wrong. Please try again.'
        return false
    } finally {
        busy.value = null
    }
}

async function connect() {
    const ok = await run('add', () => $fetch<DomainsData>(`/api/sites/${siteId}/domains`, { method: 'POST', body: { domain: newDomain.value } }))
    if (ok) {
        newDomain.value = ''
        adding.value = false
    }
}
const checkAgain = () => run('check', () => $fetch<DomainsData>(`/api/sites/${siteId}/domains/check`, { method: 'POST' }))
const makeMain = (h: string) => run(`main-${h}`, () => $fetch<DomainsData>(`/api/sites/${siteId}/domains/${encodeURIComponent(h)}/main`, { method: 'POST' }))
const remove = (h: string) => run(`del-${h}`, () => $fetch<DomainsData>(`/api/sites/${siteId}/domains/${encodeURIComponent(h)}`, { method: 'DELETE' }))

async function copy(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        copied.value = text
        setTimeout(() => (copied.value = null), 1500)
    } catch {
        // Clipboard blocked: the value is on screen to copy by hand
    }
}

/** The DNS name to type at the registrar: "@" for the bare domain, "www" for www, the label for a subdomain. */
function recordName(hostname: string, root: string) {
    if (hostname === root) return root.split('.').length > 2 && !/\.(co|org|ac|gov|me|net|ltd|plc|com)\.[a-z]{2}$/.test(root) ? hostname.split('.')[0]! : '@'
    return hostname.slice(0, -(root.length + 1))
}

const statusLook = {
    active: { label: 'Connected', dot: '#4E9C77', fg: '#1F5A3F' },
    pending: { label: 'Waiting for records', dot: '#E8A33A', fg: '#7A4B05' },
    error: { label: 'Needs attention', dot: '#A3261B', fg: '#A3261B' }
} as const

// Pending domains: check automatically every 30 seconds while the page is open
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
    timer = setInterval(() => {
        if (!busy.value && data.value?.domains.some(d => d.status === 'pending')) checkAgain()
    }, 30000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Domains</h1>
            <button v-if="!adding" class="btn btn-dark" type="button" @click="adding = true">Connect a domain</button>
        </div>

        <p v-if="error" class="error-box" role="alert">{{ error }}</p>
        <p v-if="loadError" class="error-box" role="alert">Couldn’t load your domains. Refresh the page to try again.</p>

        <DomainBuy :site-id="siteId" :can-buy="isOwner" :suggestion="me?.sites.find(x => x.id === siteId)?.slug" @bought="refreshDomains" />

        <form v-if="adding" class="panel add" @submit.prevent="connect">
            <h2>Connect a domain you own</h2>
            <p class="muted big">Type the domain you bought, like yourbusiness.co.uk. We’ll connect it with and without www.</p>
            <div class="add-row">
                <label class="visually-hidden" for="new-domain">Your domain</label>
                <input id="new-domain" v-model="newDomain" class="inp" type="text" placeholder="yourbusiness.co.uk" autocomplete="off" autocapitalize="off" spellcheck="false" required>
                <button class="btn btn-dark" type="submit" :disabled="busy === 'add'">{{ busy === 'add' ? 'Connecting…' : 'Connect' }}</button>
                <button class="btn btn-plain" type="button" @click="adding = false">Cancel</button>
            </div>
        </form>

        <section v-for="g in groups" :key="g.root" class="panel" :aria-labelledby="`d-${g.root}`">
            <div v-for="d in g.list" :key="d.hostname" class="row">
                <span class="row-text">
                    <b :id="d.hostname === g.list[0]!.hostname ? `d-${g.root}` : undefined">{{ d.hostname }}</b>
                    <span class="muted">
                        <template v-if="d.isMain">Main domain.{{ d.status === 'active' ? ' HTTPS active.' : '' }}</template>
                        <template v-else-if="data?.mainDomain">Will send visitors to {{ data.mainDomain }}</template>
                    </span>
                    <span v-if="d.detail" class="detail">{{ d.detail }}</span>
                </span>
                <span class="pill" :style="{ color: statusLook[d.status].fg }"><i :style="{ background: statusLook[d.status].dot }" />{{ statusLook[d.status].label }}</span>
                <span class="row-actions">
                    <button v-if="!d.isMain" class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="makeMain(d.hostname)">Make main</button>
                    <button class="btn btn-ghost btn-sm danger" type="button" :disabled="!!busy" :aria-label="`Disconnect ${d.hostname}`" @click="remove(d.hostname)">{{ busy === `del-${d.hostname}` ? 'Removing…' : 'Disconnect' }}</button>
                </span>
            </div>

            <div v-if="g.list.some(d => d.status !== 'active')" class="records">
                <p class="big">
                    Sign in to the company you bought this domain from, open its DNS settings and add these records.
                    Changes can take up to 24 hours to show. We check every 30 seconds while this page is open.
                </p>
                <div class="scroll">
                    <table class="tbl">
                        <thead><tr><th scope="col">Type</th><th scope="col">Name</th><th scope="col">Value</th><th scope="col"><span class="visually-hidden">Copy</span></th></tr></thead>
                        <tbody>
                            <tr v-for="d in g.list.filter(x => x.status !== 'active')" :key="d.hostname">
                                <td><b>CNAME</b></td>
                                <td>{{ recordName(d.hostname, g.root) }}</td>
                                <td class="mono">{{ data?.cnameTarget }}</td>
                                <td class="copy-cell">
                                    <button class="btn btn-ghost btn-sm" type="button" @click="copy(data?.cnameTarget ?? '')">{{ copied === data?.cnameTarget ? 'Copied' : 'Copy' }}</button>
                                </td>
                            </tr>
                            <tr v-for="d in g.list.filter(x => x.verify)" :key="`txt-${d.hostname}`">
                                <td><b>TXT</b></td>
                                <td>{{ recordName(d.verify!.name, g.root) }}</td>
                                <td class="mono">{{ d.verify!.value }}</td>
                                <td class="copy-cell">
                                    <button class="btn btn-ghost btn-sm" type="button" @click="copy(d.verify!.value)">{{ copied === d.verify!.value ? 'Copied' : 'Copy' }}</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="muted">
                    If your provider won’t let you add a CNAME for “@”, add the www record only, then use your provider’s
                    “forwarding” setting to send {{ g.root }} to www.{{ g.root }}, and make www.{{ g.root }} the main domain here.
                </p>
                <button class="btn btn-ghost btn-sm self-start" type="button" :disabled="!!busy" @click="checkAgain">{{ busy === 'check' ? 'Checking…' : 'Check again' }}</button>
            </div>
        </section>

        <section class="panel row" aria-labelledby="free-h">
            <span class="row-text">
                <b id="free-h">{{ data?.freeAddress }}</b>
                <span class="muted">Your free Slate address. It always works, even without your own domain.{{ data?.mainDomain && data.domains.some(d => d.isMain && d.status === 'active') ? ` Visitors here are sent to ${data.mainDomain}.` : '' }}</span>
            </span>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.big { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: 0; max-width: 52em; }
.self-start { align-self: flex-start; }

.add { display: flex; flex-direction: column; gap: 12px; padding: 20px 24px; }
.add-row { display: flex; flex-wrap: wrap; gap: 10px; }
.add-row .inp { flex: 1 1 280px; font-size: 16px; height: 44px; max-width: 420px; }

.row { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; padding: 20px 24px; }
.row + .row { border-top: 1px solid var(--line-soft); }
.row-text { display: flex; flex: 1; flex-direction: column; gap: 4px; min-width: 260px; }
.row-text b { font-size: 18px; }
.detail { color: var(--danger); font-size: 14px; }
.row-actions { display: flex; gap: 8px; }
.danger { color: var(--danger); }
.pill { align-items: center; display: inline-flex; font-size: 13px; font-weight: 600; gap: 7px; white-space: nowrap; }
.pill i { border-radius: 50%; display: block; height: 8px; width: 8px; }

.records { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 14px; padding: 20px 24px; }
.scroll { border-radius: var(--radius); box-shadow: 0 0 0 1px var(--line-soft); overflow-x: auto; }
.mono { font-family: ui-monospace, monospace; font-size: 14px; }
.copy-cell { text-align: right; }
</style>
