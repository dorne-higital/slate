<script setup lang="ts">
import type { SupportTicket } from '~/components/SupportThread.vue'

// Every support ticket across Slate. Platform admins only (the API answers 404 to anyone else).
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const { me } = useMe()
if (me.value && !me.value.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
useHead({ title: 'Support · Slate admin' })

type TicketRow = Omit<SupportTicket, 'messages'> & { messages: number }
const filter = ref<'open' | 'answered' | 'closed' | 'all'>('open')
const { data: tickets, refresh } = await useAsyncData('admin-support', () => useRequestFetch()<TicketRow[]>('/api/admin/support', { query: filter.value === 'all' ? {} : { status: filter.value } }), { watch: [filter], default: () => [] })

const typeFilter = ref<TicketCategory | ''>('')
const shown = computed(() => typeFilter.value ? tickets.value.filter(t => t.category === typeFilter.value) : tickets.value)
const countOf = (c: TicketCategory) => tickets.value.filter(t => t.category === c).length

const current = ref<SupportTicket | null>(null)
const busy = ref(false)
const error = ref('')
async function open(id: string) {
    error.value = ''
    current.value = await $fetch<SupportTicket>(`/api/admin/support/${id}`).catch(() => null)
    navigateTo({ query: { ticket: id } }, { replace: true })
}
onMounted(() => typeof route.query.ticket === 'string' && open(route.query.ticket))

async function run(fn: () => Promise<SupportTicket>) {
    busy.value = true
    error.value = ''
    try {
        current.value = await fn()
        await refresh()
        refreshNuxtData('admin-support-waiting')
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t send. Please try again.'
    } finally {
        busy.value = false
    }
}
const reply = (body: string) => run(() => $fetch(`/api/admin/support/${current.value!.id}/messages`, { method: 'POST', body: { body } }))
const refile = (body: { category?: TicketCategory, severity?: TicketSeverity | null }) => run(() => $fetch(`/api/admin/support/${current.value!.id}`, { method: 'PATCH', body }))
const setStatus = (status: 'open' | 'closed') => run(() => $fetch(`/api/admin/support/${current.value!.id}/status`, { method: 'POST', body: { status } }))

const statusLook = { open: { label: 'Needs a reply', cls: 'open' }, answered: { label: 'Waiting on customer', cls: 'answered' }, closed: { label: 'Closed', cls: 'closed' } } as const
const filters = [['open', 'Needs a reply'], ['answered', 'Waiting on customer'], ['closed', 'Closed'], ['all', 'All']] as const
</script>

<template>
    <div class="admin">
        <AdminHeader />
        <main class="wrap">
            <div class="head">
                <h1>Support</h1>
                <div class="seg" role="group" aria-label="Filter tickets">
                    <button v-for="f in filters" :key="f[0]" type="button" :class="{ on: filter === f[0] }" :aria-pressed="filter === f[0]" @click="filter = f[0]">{{ f[1] }}</button>
                </div>
            </div>
            <div class="types" role="group" aria-label="Filter by type">
                <button type="button" class="type-chip" :class="{ on: !typeFilter }" :aria-pressed="!typeFilter" @click="typeFilter = ''">All types</button>
                <button v-for="c in TICKET_CATEGORIES" :key="c.key" type="button" class="type-chip" :class="{ on: typeFilter === c.key }" :aria-pressed="typeFilter === c.key" :style="{ '--tbg': c.colour.bg, '--tfg': c.colour.fg }" @click="typeFilter = typeFilter === c.key ? '' : c.key">
                    <i class="sw" aria-hidden="true" />{{ c.name }} <span class="n">{{ countOf(c.key) }}</span>
                </button>
            </div>
            <p v-if="error" class="error-box" role="alert">{{ error }}</p>

            <div class="two">
                <section class="panel list" aria-label="Tickets">
                    <ul v-if="shown.length">
                        <li v-for="t in shown" :key="t.id">
                            <button type="button" class="t-row" :class="{ sel: current?.id === t.id }" @click="open(t.id)">
                                <span class="t-top"><b>{{ t.subject }}</b><span class="tag" :class="statusLook[t.status].cls">{{ statusLook[t.status].label }}</span></span>
                                <TicketTags :category="t.category" :severity="t.severity" />
                                <span class="muted small">{{ t.siteName }} · {{ t.openedByName }} · {{ formatWhen(t.updatedAt) }}</span>
                            </button>
                        </li>
                    </ul>
                    <p v-else class="muted empty">No tickets here.</p>
                </section>

                <section v-if="current" class="panel box" :aria-label="current.subject">
                    <div class="t-head">
                        <div>
                            <h2>{{ current.subject }}</h2>
                            <span class="muted small">
                                <NuxtLink :to="`/sites/${current.siteId}`">{{ current.siteName }}</NuxtLink> · {{ current.openedByName }}
                                <template v-if="current.openedByEmail"> · <a :href="`mailto:${current.openedByEmail}`">{{ current.openedByEmail }}</a></template>
                            </span>
                        </div>
                        <span class="tag" :class="statusLook[current.status].cls">{{ statusLook[current.status].label }}</span>
                    </div>
                    <div class="refile">
                        <TicketTags :category="current.category" :severity="current.severity" />
                        <label class="small">Type
                            <select class="inp sm" :value="current.category" :disabled="busy" @change="refile({ category: ($event.target as HTMLSelectElement).value as TicketCategory })">
                                <option v-for="c in TICKET_CATEGORIES" :key="c.key" :value="c.key">{{ c.name }}</option>
                            </select>
                        </label>
                        <label v-if="current.category === 'bug'" class="small">Severity
                            <select class="inp sm" :value="current.severity ?? ''" :disabled="busy" @change="refile({ severity: (($event.target as HTMLSelectElement).value || null) as TicketSeverity | null })">
                                <option value="">Not set</option>
                                <option v-for="s in TICKET_SEVERITIES" :key="s.key" :value="s.key">{{ s.name }}</option>
                            </select>
                        </label>
                    </div>
                    <SupportThread :ticket="current" side="slate" :busy="busy" @reply="reply" @close="setStatus('closed')" @reopen="setStatus('open')" />
                </section>
                <p v-else class="muted pick">Choose a ticket to read and reply.</p>
            </div>
        </main>
    </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 1200px; padding: 28px 24px 56px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; height: 32px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.two { align-items: start; display: grid; gap: 20px; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); }
.list ul { list-style: none; margin: 0; padding: 0; }
.list li + li { border-top: 1px solid var(--line-soft); }
.t-row { background: none; border: 0; color: inherit; cursor: pointer; display: flex; flex-direction: column; font: inherit; gap: 4px; padding: 12px 16px; text-align: left; width: 100%; }
.t-row:hover { background: #fafbfc; }
.t-row.sel { background: #eef1f7; }
.t-top { align-items: flex-start; display: flex; gap: 8px; justify-content: space-between; }
.small { font-size: 13px; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.t-head { align-items: flex-start; display: flex; gap: 12px; justify-content: space-between; }
.tag { border-radius: 999px; flex: none; font-size: 11px; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
.tag.open { background: #fbeceb; color: var(--danger); }
.tag.answered { background: #fff3de; color: #8a5300; }
.tag.closed { background: var(--mist); color: var(--text-muted); }
.empty, .pick { margin: 0; padding: 20px; }
.types { display: flex; flex-wrap: wrap; gap: 6px; }
.type-chip { align-items: center; background: var(--white); border: 1.5px solid var(--line); border-radius: 999px; color: var(--quarry); cursor: pointer; display: inline-flex; font: inherit; font-size: 13px; font-weight: 600; gap: 6px; padding: 5px 12px; }
.type-chip.on { background: var(--tbg, var(--quarry)); border-color: var(--tfg, var(--quarry)); color: var(--tfg, var(--white)); }
.type-chip .sw { background: var(--tfg, var(--quarry)); border-radius: 50%; height: 8px; width: 8px; }
.type-chip .n { color: var(--text-muted); font-weight: 500; }
.refile { align-items: center; background: var(--paper); border-radius: var(--radius); display: flex; flex-wrap: wrap; gap: 12px; padding: 8px 12px; }
.refile label { align-items: center; display: inline-flex; gap: 6px; }
.inp.sm { font-size: 13px; height: 32px; padding: 0 8px; width: auto; }
@media (max-width: 900px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
