<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const router = useRouter()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

interface ConnectionsData { connections: SiteConnectionsView, forms: { id: string, name: string }[], allowed: boolean }
const [{ data: site }, { data: conn, refresh: refreshConn }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`connections-${siteId}`, () => fetcher<ConnectionsData>(`/api/sites/${siteId}/connections`).catch(() => null))
])
useHead({ title: 'Integrations · Slate' })

const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.admin)
const values = ref<SiteIntegrations>({ ...(site.value?.integrations as SiteIntegrations) })
const connections = computed<SiteConnectionsView>(() => conn.value?.connections ?? {})
const limits = computed(() => (site.value as { billing?: { limits?: PlanLimits } } | null)?.billing?.limits)

// ── Status of each card ──
type Status = { label: string, tone: 'ok' | 'warn' | 'off' | 'lock' | 'soon' | 'none' }
function locked(i: CatalogueItem) {
    if (i.kind === 'connection') return conn.value ? !conn.value.allowed : false
    if (i.kind === 'id' && i.key && limits.value) return !integrationAllowed(limits.value, i.key)
    return false
}
function status(i: CatalogueItem): Status {
    if (i.kind === 'soon') return { label: 'Coming soon', tone: 'soon' }
    if (i.id === 'stats') return values.value.stats === 'off' ? { label: 'Off', tone: 'off' } : { label: 'On', tone: 'ok' }
    if (i.kind === 'builtin') return { label: 'On', tone: 'ok' }
    if (i.kind === 'connection') {
        const c = i.connection ? connections.value[i.connection] : undefined
        if (c?.lastError) return { label: 'Needs attention', tone: 'warn' }
        if (c) return { label: 'Connected', tone: 'ok' }
    }
    if (i.kind === 'id' && i.key && values.value[i.key]) return { label: 'Connected', tone: 'ok' }
    if (locked(i)) return { label: 'Business plan', tone: 'lock' }
    return { label: '', tone: 'none' }
}
const isOn = (i: CatalogueItem) => ['ok', 'warn'].includes(status(i).tone) && i.kind !== 'builtin'
const action = (i: CatalogueItem) => i.kind === 'soon' ? 'Coming soon' : i.kind === 'link' ? (i.linkLabel ?? 'Open') : i.kind === 'builtin' ? 'Details' : isOn(i) ? 'Manage' : 'Connect'

// ── Tabs and search ──
const tabs = computed(() => [
    { key: 'all', name: 'All', count: CATALOGUE.length },
    { key: 'connected', name: 'Connected', count: CATALOGUE.filter(isOn).length },
    ...[...INTEGRATION_CATEGORIES].sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ key: c.key, name: c.name, count: CATALOGUE.filter(i => i.category === c.key).length }))
])
const tab = computed({
    get: () => tabs.value.some(t => t.key === route.query.tab) ? String(route.query.tab) : 'all',
    set: v => router.replace({ query: { ...route.query, tab: v === 'all' ? undefined : v } })
})
const q = ref('')
const shown = computed(() => {
    const term = q.value.trim().toLowerCase()
    return CATALOGUE
        .filter(i => tab.value === 'all' || (tab.value === 'connected' ? isOn(i) : i.category === tab.value))
        .filter(i => !term || `${i.name} ${i.desc}`.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name, 'en-GB'))
})
const categoryName = (c: IntegrationCategory) => INTEGRATION_CATEGORIES.find(x => x.key === c)?.name ?? ''

// ── The settings window ──
const active = ref<CatalogueItem | null>(null)
const draft = ref<string[]>([])
const url = ref('')
const apiKey = ref('')
const lists = ref<{ id: string, name: string }[]>([])
const listId = ref('')
const formId = ref('')
const busy = ref<'' | 'save' | 'remove' | 'test' | 'lists'>('')
const error = ref('')
const notice = ref('')
const boxEl = ref<HTMLElement | null>(null)

const appStoreLink = computed(() => (site.value?.socials as SiteSocials | undefined)?.appStore ?? '')

function open(i: CatalogueItem) {
    if (i.kind === 'soon') return
    if (i.kind === 'link' && !i.about) return goTo(i)
    active.value = i
    error.value = ''
    notice.value = ''
    url.value = ''
    apiKey.value = ''
    lists.value = []
    if (i.key === 'androidAppLinks') {
        const p = androidAppLinksParts(values.value.androidAppLinks)
        draft.value = [p.pkg, p.prints.join(' ')]
    } else if (i.key) {
        draft.value = [values.value[i.key] ?? (i.key === 'iosAppBanner' ? appStoreLink.value : '')]
    }
    const c = i.connection ? connections.value[i.connection] : undefined
    listId.value = ''
    formId.value = c?.formId ?? (conn.value?.forms.length === 1 ? conn.value.forms[0]!.id : '')
    if (c?.listName && (i.connection === 'mailchimp' || i.connection === 'brevo')) loadLists(true)
    nextTick(() => boxEl.value?.querySelector<HTMLElement>('input:not([disabled]), select, button.x')?.focus())
}
function close() {
    active.value = null
}
function goTo(i: CatalogueItem) {
    navigateTo(`/sites/${siteId}${i.to ?? ''}`)
}
const message = (err: unknown) => (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Something went wrong. Please try again.'

async function run(kind: typeof busy.value, fn: () => Promise<void>) {
    busy.value = kind
    error.value = ''
    notice.value = ''
    try {
        await fn()
    } catch (err) {
        error.value = message(err)
    } finally {
        busy.value = ''
    }
}

// Public IDs and links (sites.integrations)
const saveId = (i: CatalogueItem, value: string) => run(value ? 'save' : 'remove', async () => {
    values.value = await $fetch<SiteIntegrations>(`/api/sites/${siteId}/integrations`, { method: 'PUT', body: { key: i.key, value } })
    if (i.id !== 'stats') close()
})

// Secrets (sites.connections)
const saveUrl = (i: CatalogueItem) => run('save', async () => {
    await $fetch(`/api/sites/${siteId}/connections`, { method: 'PUT', body: { key: i.connection, url: url.value } })
    await refreshConn()
    url.value = ''
    notice.value = 'Connected. Send a test to check it arrives.'
})
const loadLists = (quiet = false) => run('lists', async () => {
    const key = active.value?.connection
    lists.value = await $fetch(`/api/sites/${siteId}/connections/lists`, { method: 'POST', body: { key, apiKey: apiKey.value || undefined } })
    const saved = key ? connections.value[key] : undefined
    listId.value = lists.value.find(l => l.name === saved?.listName)?.id ?? (lists.value.length === 1 ? lists.value[0]!.id : '')
    if (quiet) error.value = ''
})
const saveList = (i: CatalogueItem) => run('save', async () => {
    await $fetch(`/api/sites/${siteId}/connections`, { method: 'PUT', body: { key: i.connection, apiKey: apiKey.value || undefined, listId: listId.value, formId: formId.value } })
    await refreshConn()
    apiKey.value = ''
    notice.value = 'Saved. People who send that form will be added from now on.'
})
const removeConnection = (i: CatalogueItem) => run('remove', async () => {
    await $fetch(`/api/sites/${siteId}/connections`, { method: 'PUT', body: { key: i.connection, remove: true } })
    await refreshConn()
    close()
})
const test = (i: CatalogueItem) => run('test', async () => {
    const res = await $fetch<{ message: string }>(`/api/sites/${siteId}/connections/test`, { method: 'POST', body: { key: i.connection } })
    await refreshConn()
    notice.value = res.message
})

const activeConn = computed(() => active.value?.connection ? connections.value[active.value.connection] : undefined)
const isList = computed(() => active.value?.connection === 'mailchimp' || active.value?.connection === 'brevo')
const when = (iso?: string) => iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && active.value) close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <div class="page">
        <div class="head">
            <div>
                <h1>Integrations</h1>
                <p class="lead">Connect the tools you already use. Everything here uses your own accounts, and you can switch anything off at any time.</p>
            </div>
            <label class="search">
                <span class="sr-only">Search integrations</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input v-model="q" type="search" placeholder="Search" autocomplete="off">
            </label>
        </div>

        <div class="tabs" role="tablist" aria-label="Filter integrations">
            <button
                v-for="t in tabs" :key="t.key" type="button" role="tab" class="tab" :class="{ on: tab === t.key }"
                :aria-selected="tab === t.key" @click="tab = t.key"
            >
                {{ t.name }}<span class="count">{{ t.count }}</span>
            </button>
        </div>

        <div v-if="shown.length" class="grid">
            <button
                v-for="i in shown" :key="i.id" type="button" class="card" :class="{ soon: i.kind === 'soon', on: isOn(i) }"
                :disabled="i.kind === 'soon'" @click="open(i)"
            >
                <span class="card-top">
                    <span class="tile" :style="{ background: i.tile, color: i.ink ?? '#fff' }" aria-hidden="true">
                        <svg v-if="i.id === 'appleAppLinks'" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7a4.6 4.6 0 0 0-3.6-2c-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.9a4.8 4.8 0 0 0-4 2.5c-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.1-1.2 2.9-2.4a10 10 0 0 0 1.3-2.7 4.2 4.2 0 0 1-2.3-3.9ZM14 5.2A4.3 4.3 0 0 0 15 2a4.4 4.4 0 0 0-2.9 1.5 4.1 4.1 0 0 0-1 3.1A3.7 3.7 0 0 0 14 5.2Z" /></svg>
                        <template v-else>{{ i.mark }}</template>
                    </span>
                    <span v-if="status(i).label" class="chip" :class="status(i).tone">
                        <svg v-if="status(i).tone === 'lock'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                        <i v-else-if="status(i).tone !== 'soon'" />
                        {{ status(i).label }}
                    </span>
                </span>
                <span class="name">{{ i.name }}</span>
                <span class="desc">{{ i.desc }}</span>
                <span class="card-foot">
                    <span class="cat">{{ categoryName(i.category) }}</span>
                    <span v-if="i.kind !== 'soon'" class="go">{{ action(i) }}<span aria-hidden="true"> →</span></span>
                </span>
            </button>
        </div>
        <div v-else class="empty panel">
            <b>Nothing matches “{{ q }}”</b>
            <span class="muted">Try another word, or tell us what you’d like connected from the Support page.</span>
        </div>

        <!-- Settings for one integration -->
        <div v-if="active" class="back" @click.self="close">
            <div ref="boxEl" class="box panel" role="dialog" aria-modal="true" aria-labelledby="int-h">
                <div class="box-head">
                    <span class="tile big" :style="{ background: active.tile, color: active.ink ?? '#fff' }" aria-hidden="true">{{ active.id === 'appleAppLinks' ? '' : active.mark }}</span>
                    <div class="box-title">
                        <h2 id="int-h">{{ active.name }}</h2>
                        <span class="muted">{{ categoryName(active.category) }}<template v-if="status(active).label"> · {{ status(active).label }}</template></span>
                    </div>
                    <button type="button" class="x" aria-label="Close" @click="close">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                    </button>
                </div>

                <p class="about">{{ active.about ?? active.desc }}</p>

                <div v-if="locked(active) && !isOn(active)" class="lock">
                    <b>{{ active.name }} comes with the Business and Studio plans.</b>
                    <NuxtLink :to="`/sites/${siteId}/billing`" class="btn btn-lichen btn-sm">See plans</NuxtLink>
                </div>

                <!-- Built-in visitor stats: on/off -->
                <template v-else-if="active.id === 'stats'">
                    <div class="switch-row">
                        <div><b>Count visits to this site</b><span class="muted">No cookies, no banner, nothing personal stored.</span></div>
                        <button
                            type="button" class="switch" role="switch" :aria-checked="values.stats !== 'off'" :disabled="!canEdit || !!busy"
                            @click="saveId(active, values.stats === 'off' ? '' : 'off')"
                        ><span /></button>
                    </div>
                </template>

                <!-- Links elsewhere in the CMS -->
                <template v-else-if="active.kind === 'link'">
                    <div class="actions"><button type="button" class="btn btn-dark btn-sm" @click="goTo(active)">{{ active.linkLabel }}</button></div>
                </template>

                <!-- Paste an ID or link -->
                <form v-else-if="active.kind === 'id' && active.fields" class="form" @submit.prevent="saveId(active, draft.map(d => d.trim()).filter(Boolean).join(' '))">
                    <div v-for="(f, n) in active.fields" :key="f.label" class="field">
                        <label :for="`f-${n}`">{{ f.label }}</label>
                        <input
                            
                            :id="`f-${n}`" v-model="draft[n]" class="inp mono" type="text"
                            :placeholder="f.placeholder" autocomplete="off" spellcheck="false" :disabled="!canEdit"
                        >
                        <span class="help">{{ f.help }}</span>
                    </div>
                    <p v-if="active.key === 'iosAppBanner' && !values.iosAppBanner && appStoreLink" class="hint">We’ve filled in the App Store link from Settings.</p>
                    <p v-if="active.needsConsent" class="hint">Visitors are asked for cookie consent before this runs, as UK law requires.</p>
                    <p v-if="error" class="err" role="alert">{{ error }}</p>
                    <div v-if="canEdit" class="actions">
                        <button class="btn btn-dark btn-sm" type="submit" :disabled="!!busy">{{ busy === 'save' ? 'Saving…' : 'Save' }}</button>
                        <button v-if="active.key && values[active.key]" class="btn btn-plain btn-sm danger" type="button" :disabled="!!busy" @click="saveId(active, '')">Disconnect</button>
                    </div>
                </form>

                <!-- Webhook, Slack, Discord -->
                <form v-else-if="active.kind === 'connection' && !isList" class="form" @submit.prevent="saveUrl(active)">
                    <p v-if="activeConn" class="current">Sending to <code>{{ activeConn.hint }}</code></p>
                    <div class="field">
                        <label for="c-url">{{ activeConn ? 'Change the address' : 'Webhook address' }}</label>
                        <input
                            id="c-url" v-model="url" class="inp mono" type="url" autocomplete="off" spellcheck="false" :disabled="!canEdit"
                            :placeholder="active.connection === 'slack' ? 'https://hooks.slack.com/services/…' : active.connection === 'discord' ? 'https://discord.com/api/webhooks/…' : 'https://hooks.zapier.com/hooks/catch/…'"
                        >
                        <span class="help">Kept private: only the end of it is ever shown again.</span>
                    </div>
                    <template v-if="activeConn">
                        <p v-if="activeConn.lastError" class="err">Last send failed {{ when(activeConn.lastErrorAt) }}: {{ activeConn.lastError }}</p>
                        <p v-else-if="activeConn.lastOkAt" class="hint">Last sent {{ when(activeConn.lastOkAt) }}.</p>
                    </template>
                    <p v-if="error" class="err" role="alert">{{ error }}</p>
                    <p v-if="notice" class="ok" role="status">{{ notice }}</p>
                    <div v-if="canEdit" class="actions">
                        <button class="btn btn-dark btn-sm" type="submit" :disabled="!!busy || !url">{{ busy === 'save' ? 'Saving…' : activeConn ? 'Save new address' : 'Connect' }}</button>
                        <button v-if="activeConn" class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="test(active)">{{ busy === 'test' ? 'Sending…' : 'Send a test' }}</button>
                        <button v-if="activeConn" class="btn btn-plain btn-sm danger" type="button" :disabled="!!busy" @click="removeConnection(active)">Disconnect</button>
                    </div>
                </form>

                <!-- Mailchimp, Brevo -->
                <form v-else-if="active.kind === 'connection'" class="form" @submit.prevent="saveList(active)">
                    <p v-if="activeConn" class="current">Adding people from <b>{{ conn?.forms.find(f => f.id === activeConn?.formId)?.name ?? 'a form' }}</b> to <b>{{ activeConn.listName }}</b> · key <code>{{ activeConn.hint }}</code></p>
                    <div class="field">
                        <label for="c-key">{{ activeConn ? 'New API key (optional)' : 'API key' }}</label>
                        <div class="inline">
                            <input id="c-key" v-model="apiKey" class="inp mono" type="password" autocomplete="off" spellcheck="false" :disabled="!canEdit" :placeholder="active.connection === 'mailchimp' ? '0123…abcd-us21' : 'xkeysib-…'">
                            <button class="btn btn-ghost btn-sm" type="button" :disabled="!!busy || (!apiKey && !activeConn)" @click="loadLists()">{{ busy === 'lists' ? 'Checking…' : 'Check key' }}</button>
                        </div>
                    </div>
                    <template v-if="lists.length">
                        <div class="field">
                            <label for="c-list">{{ active.connection === 'mailchimp' ? 'Audience' : 'List' }}</label>
                            <select id="c-list" v-model="listId" class="inp" :disabled="!canEdit">
                                <option value="" disabled>Choose one</option>
                                <option v-for="l in lists" :key="l.id" :value="l.id">{{ l.name }}</option>
                            </select>
                        </div>
                        <div class="field">
                            <label for="c-form">Add people who send</label>
                            <select id="c-form" v-model="formId" class="inp" :disabled="!canEdit || !conn?.forms.length">
                                <option value="" disabled>{{ conn?.forms.length ? 'Choose a form' : 'No forms with an email field yet' }}</option>
                                <option v-for="f in conn?.forms ?? []" :key="f.id" :value="f.id">{{ f.name }}</option>
                            </select>
                            <span class="help">Use a form where people ask to hear from you, like a newsletter sign-up.</span>
                        </div>
                    </template>
                    <p v-if="activeConn?.lastError" class="err">Last add failed {{ when(activeConn.lastErrorAt) }}: {{ activeConn.lastError }}</p>
                    <p v-if="error" class="err" role="alert">{{ error }}</p>
                    <p v-if="notice" class="ok" role="status">{{ notice }}</p>
                    <div v-if="canEdit" class="actions">
                        <button v-if="lists.length" class="btn btn-dark btn-sm" type="submit" :disabled="!!busy || !listId || !formId">{{ busy === 'save' ? 'Saving…' : 'Save' }}</button>
                        <button v-if="activeConn" class="btn btn-ghost btn-sm" type="button" :disabled="!!busy" @click="test(active)">{{ busy === 'test' ? 'Adding…' : 'Add me as a test' }}</button>
                        <button v-if="activeConn" class="btn btn-plain btn-sm danger" type="button" :disabled="!!busy" @click="removeConnection(active)">Disconnect</button>
                    </div>
                </form>

                <p v-if="!canEdit && active.kind !== 'link'" class="hint">Only site admins and owners can change integrations.</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 22px; }
.head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 16px 24px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: 6px 0 0; max-width: 40em; }
.search { align-items: center; background: var(--white); border-radius: 999px; box-shadow: inset 0 0 0 1.5px var(--line); color: var(--text-muted); display: flex; gap: 8px; height: 42px; padding: 0 16px; width: min(280px, 100%); }
.search:focus-within { box-shadow: inset 0 0 0 1.5px var(--quarry), 0 0 0 3px var(--lichen-focus); }
.search input { background: none; border: 0; color: var(--text); flex: 1; font: inherit; font-size: 15px; min-width: 0; outline: none; }
.sr-only { clip: rect(0 0 0 0); height: 1px; overflow: hidden; position: absolute; width: 1px; }

/* Tabs */
.tabs { border-bottom: 1px solid var(--line); display: flex; gap: 4px; margin-top: -4px; overflow-x: auto; scrollbar-width: none; }
.tabs::-webkit-scrollbar { display: none; }
.tab { align-items: center; background: none; border: 0; border-bottom: 2.5px solid transparent; color: var(--text-muted); cursor: pointer; display: inline-flex; flex: none; font: inherit; font-size: 15px; font-weight: 600; gap: 7px; margin-bottom: -1px; padding: 10px 12px 12px; transition: color .15s; }
.tab:hover { color: var(--text); }
.tab.on { border-bottom-color: var(--quarry); color: var(--text); }
.tab:focus-visible { border-radius: 6px; outline: 3px solid var(--lichen-focus); }
.count { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 12px; font-weight: 700; min-width: 22px; padding: 2px 7px; text-align: center; }
.tab.on .count { background: var(--quarry); color: var(--white); }

/* Cards */
.grid { display: grid; gap: 16px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.card {
    background: var(--white);
    border: 0;
    border-radius: 12px;
    box-shadow: 0 0 0 1px var(--line), 0 1px 2px rgb(20 24 33 / 4%);
    color: var(--text);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font: inherit;
    gap: 6px;
    min-height: 196px;
    padding: 18px 18px 14px;
    text-align: left;
    transition: box-shadow .18s ease, transform .18s ease;
}
.card:hover { box-shadow: 0 0 0 1px var(--split), 0 10px 28px rgb(20 24 33 / 9%); transform: translateY(-2px); }
.card:focus-visible { box-shadow: 0 0 0 2px var(--quarry), 0 0 0 5px var(--lichen-focus); outline: none; }
.card.on { box-shadow: 0 0 0 1px color-mix(in srgb, var(--ok) 45%, var(--line)), 0 1px 2px rgb(20 24 33 / 4%); }
.card.soon { cursor: default; opacity: .62; }
.card.soon:hover { box-shadow: 0 0 0 1px var(--line); transform: none; }
.card-top { align-items: flex-start; display: flex; justify-content: space-between; margin-bottom: 8px; }
.tile { align-items: center; border-radius: 11px; display: flex; flex: none; font-size: 15px; font-weight: 800; height: 44px; justify-content: center; letter-spacing: -.02em; width: 44px; }
.tile.big { border-radius: 13px; font-size: 18px; height: 52px; width: 52px; }
.chip { align-items: center; border-radius: 999px; display: inline-flex; font-size: 12px; font-weight: 700; gap: 6px; padding: 4px 10px; white-space: nowrap; }
.chip i { border-radius: 50%; display: block; height: 7px; width: 7px; }
.chip.ok { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok-text); }
.chip.ok i { background: var(--ok); }
.chip.warn { background: #fdf0dc; color: var(--warn-text); }
.chip.warn i { background: var(--lichen); }
.chip.off { background: var(--mist); color: var(--text-muted); }
.chip.off i { background: var(--split); }
.chip.lock { background: var(--paper); box-shadow: inset 0 0 0 1px var(--line); color: var(--text-muted); }
.chip.soon { background: var(--mist); color: var(--text-muted); }
.name { font-size: 17px; font-weight: 700; letter-spacing: -.01em; }
.desc { color: var(--text-body); flex: 1; font-size: 14px; line-height: 1.5; }
.card-foot { align-items: center; border-top: 1px solid var(--line-soft); display: flex; justify-content: space-between; margin-top: 10px; padding-top: 12px; }
.cat { color: var(--text-muted); font-size: 13px; }
.go { color: var(--quarry); font-size: 14px; font-weight: 700; }
.card:hover .go span { display: inline-block; transform: translateX(2px); transition: transform .15s; }
.empty { align-items: center; display: flex; flex-direction: column; gap: 6px; padding: 48px 20px; text-align: center; }

/* Settings window */
.back { align-items: center; animation: fade .15s ease; background: rgb(20 24 33 / 45%); display: flex; inset: 0; justify-content: center; padding: 16px; position: fixed; z-index: 60; }
.box { animation: rise .18s ease; border-radius: 14px; display: flex; flex-direction: column; gap: 16px; max-height: 90vh; max-width: 540px; overflow: auto; padding: 22px 24px 24px; width: 100%; }
.box-head { align-items: center; display: flex; gap: 14px; }
.box-title { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.box-title h2 { font-size: 21px; font-weight: 800; letter-spacing: -.02em; margin: 0; }
.x { align-items: center; background: none; border: 0; border-radius: 8px; color: var(--text-muted); cursor: pointer; display: flex; height: 36px; justify-content: center; width: 36px; }
.x:hover { background: var(--mist); color: var(--text); }
.about { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: 0; }
.form { display: flex; flex-direction: column; gap: 14px; }
.field label { font-size: 14px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; }
.inline { display: flex; gap: 8px; }
.inline .inp { flex: 1; min-width: 0; }
.actions { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.hint { color: var(--text-muted); font-size: 14px; margin: 0; }
.current { background: var(--paper); border-radius: 8px; font-size: 14px; margin: 0; padding: 10px 12px; }
code { font-size: 13px; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.ok { color: var(--ok-text); font-size: 14px; font-weight: 600; margin: 0; }
.danger { color: var(--danger); }
.lock { align-items: center; background: var(--paper); border-radius: 10px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; padding: 14px 16px; }
.lock b { font-size: 15px; }
.switch-row { align-items: center; background: var(--paper); border-radius: 10px; display: flex; gap: 16px; justify-content: space-between; padding: 14px 16px; }
.switch-row > div { display: flex; flex-direction: column; gap: 2px; }
.switch { background: var(--split); border: 0; border-radius: 999px; cursor: pointer; flex: none; height: 28px; padding: 3px; position: relative; transition: background .15s; width: 48px; }
.switch span { background: var(--white); border-radius: 50%; box-shadow: 0 1px 3px rgb(0 0 0 / 25%); display: block; height: 22px; transition: transform .15s; width: 22px; }
.switch[aria-checked='true'] { background: var(--ok); }
.switch[aria-checked='true'] span { transform: translateX(20px); }
.switch:focus-visible { outline: 3px solid var(--lichen-focus); outline-offset: 2px; }

@keyframes fade { from { opacity: 0; } }
@keyframes rise { from { opacity: 0; transform: translateY(8px) scale(.98); } }
@media (max-width: 1100px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) {
    .grid { grid-template-columns: minmax(0, 1fr); }
    .card { min-height: 0; }
    .search { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
    .card, .back, .box, .switch, .switch span { animation: none; transition: none; }
    .card:hover { transform: none; }
}
</style>
