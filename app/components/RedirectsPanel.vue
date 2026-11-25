<script setup lang="ts">
// Old addresses that send visitors somewhere else: one at a time, or a pasted list (moving from another website).
const props = defineProps<{ siteId: string, canEdit: boolean }>()
interface Redirect { id: string, from: string, to: string, permanent: boolean, hits: number, lastHitAt: string | null, createdAt: string }

const { data: list, refresh } = await useAsyncData(`redirects-${props.siteId}`, () => useRequestFetch()<Redirect[]>(`/api/sites/${props.siteId}/redirects`), { default: () => [] })
const table = useDataTable(() => list.value ?? [], {
    sorters: { from: r => r.from, to: r => r.to, hits: r => r.hits, created: r => r.createdAt },
    search: r => `${r.from} ${r.to}`,
    initialSort: { key: 'created', dir: 'desc' }
})

const from = ref('')
const to = ref('')
const bulk = ref('')
const mode = ref<'one' | 'many'>('one')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const skipped = ref<{ line: number, from: string, reason: string }[]>([])

async function add() {
    busy.value = true
    error.value = ''
    notice.value = ''
    skipped.value = []
    try {
        if (mode.value === 'one') {
            await $fetch(`/api/sites/${props.siteId}/redirects`, { method: 'POST', body: { from: from.value, to: to.value } })
            notice.value = `Added. ${from.value} now goes to ${to.value}.`
            from.value = ''
            to.value = ''
        } else {
            const res = await $fetch<{ added: number, skipped: typeof skipped.value }>(`/api/sites/${props.siteId}/redirects`, { method: 'POST', body: { items: parseRedirectLines(bulk.value) } })
            skipped.value = res.skipped
            notice.value = `${res.added} ${res.added === 1 ? 'redirect' : 'redirects'} added${res.skipped.length ? `, ${res.skipped.length} skipped (below)` : ''}.`
            if (!res.skipped.length) bulk.value = ''
        }
        await refresh()
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t add that. Please try again.'
    } finally {
        busy.value = false
    }
}
async function remove(r: Redirect) {
    await $fetch(`/api/sites/${props.siteId}/redirects/${r.id}`, { method: 'DELETE' })
    await refresh()
}
const when = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Not yet'
</script>

<template>
    <section class="panel rd" aria-labelledby="rd-h">
        <div class="rd-head">
            <div>
                <h2 id="rd-h">Redirects</h2>
                <p class="muted">Send people from an old address to a new one, for example after moving from another website or renaming a page. Google follows them too, so you keep your place in search.</p>
            </div>
        </div>

        <form v-if="canEdit" class="rd-add" @submit.prevent="add">
            <div class="seg" role="group" aria-label="Add one or many">
                <button type="button" :class="{ on: mode === 'one' }" :aria-pressed="mode === 'one'" @click="mode = 'one'">Add one</button>
                <button type="button" :class="{ on: mode === 'many' }" :aria-pressed="mode === 'many'" @click="mode = 'many'">Paste a list</button>
            </div>
            <div v-if="mode === 'one'" class="rd-row">
                <label class="grow"><span class="lbl">Old address</span><input v-model="from" class="inp mono" type="text" placeholder="/old-page or oldsite.co.uk/old-page" autocomplete="off" spellcheck="false"></label>
                <span class="arrow" aria-hidden="true">→</span>
                <label class="grow"><span class="lbl">Send people to</span><input v-model="to" class="inp mono" type="text" placeholder="/new-page or https://…" autocomplete="off" spellcheck="false"></label>
                <button class="btn btn-dark" type="submit" :disabled="busy || !from || !to">{{ busy ? 'Adding…' : 'Add' }}</button>
            </div>
            <div v-else class="rd-many">
                <label><span class="lbl">One per line: old address, then where it goes</span>
                    <textarea v-model="bulk" class="inp mono" rows="6" placeholder="/about-us /about&#10;/services.html /services&#10;oldsite.co.uk/contact-us /contact" spellcheck="false" />
                </label>
                <button class="btn btn-dark self-start" type="submit" :disabled="busy || !bulk.trim()">{{ busy ? 'Adding…' : 'Add them all' }}</button>
            </div>
            <p v-if="error" class="err" role="alert">{{ error }}</p>
            <p v-if="notice" class="ok" role="status">{{ notice }}</p>
            <ul v-if="skipped.length" class="skipped">
                <li v-for="s in skipped" :key="s.line"><b>Line {{ s.line }}</b> <span class="mono">{{ s.from || '(empty)' }}</span>: {{ s.reason }}</li>
            </ul>
        </form>

        <template v-if="list?.length">
            <div v-if="list.length > 8" class="rd-tools">
                <input v-model="table.q" class="inp" type="search" placeholder="Search redirects" aria-label="Search redirects">
            </div>
            <div class="scroll">
                <table class="tbl">
                    <thead><tr><SortTh :table="table" col="from" label="Old address" /><SortTh :table="table" col="to" label="Goes to" /><SortTh :table="table" col="hits" label="Used" /><th scope="col"><span class="visually-hidden">Remove</span></th></tr></thead>
                    <tbody>
                        <tr v-for="r in table.rows" :key="r.id">
                            <td class="mono">{{ r.from }}</td>
                            <td class="mono to">{{ r.to }}</td>
                            <td class="muted">{{ r.hits ? `${r.hits} ${r.hits === 1 ? 'time' : 'times'} · last ${when(r.lastHitAt)}` : 'Not yet' }}</td>
                            <td class="end"><button v-if="canEdit" class="btn btn-plain btn-sm danger" type="button" @click="remove(r)">Remove</button></td>
                        </tr>
                        <tr v-if="!table.total"><td colspan="4" class="muted">No redirects match.</td></tr>
                    </tbody>
                </table>
            </div>
            <TablePager :table="table" noun="redirects" />
        </template>
        <p v-else class="muted none">No redirects yet.</p>
    </section>
</template>

<style scoped>
.rd { display: flex; flex-direction: column; }
.rd-head { padding: 18px 20px 6px; }
.rd-head h2 { font-size: 18px; margin: 0 0 4px; }
.rd-head p { font-size: 14px; line-height: 1.5; margin: 0; max-width: 60em; }
.rd-add { display: flex; flex-direction: column; gap: 12px; padding: 12px 20px 18px; }
.seg { align-self: flex-start; background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font: inherit; font-size: 14px; font-weight: 600; height: 32px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.rd-row { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 10px; }
.grow { display: flex; flex: 1 1 220px; flex-direction: column; gap: 6px; }
.lbl { font-size: 14px; font-weight: 600; }
.arrow { color: var(--text-muted); padding-bottom: 10px; }
.rd-many { display: flex; flex-direction: column; gap: 10px; }
.rd-many label { display: flex; flex-direction: column; gap: 6px; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; }
.inp { height: 42px; }
textarea.inp { height: auto; padding: 10px 12px; }
.self-start { align-self: flex-start; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.ok { color: var(--ok-text); font-size: 14px; font-weight: 600; margin: 0; }
.skipped { background: #fdf0dc; border-radius: var(--radius); display: flex; flex-direction: column; font-size: 14px; gap: 4px; list-style: none; margin: 0; padding: 10px 14px; }
.rd-tools { border-top: 1px solid var(--line-soft); padding: 12px 20px; }
.rd-tools .inp { font-size: 14px; height: 38px; max-width: 320px; }
.to { overflow-wrap: anywhere; }
.end { text-align: right; }
.danger { color: var(--danger); }
.none { border-top: 1px solid var(--line-soft); margin: 0; padding: 14px 20px; }
</style>
