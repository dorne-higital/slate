<script setup lang="ts">
import type { SupportTicket } from '~/components/SupportThread.vue'

definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
type TicketRow = Omit<SupportTicket, 'messages'> & { messages: number, unread: boolean }

const { data: tickets, refresh } = await useAsyncData(`support-${siteId}`, () => fetcher<TicketRow[]>(`/api/sites/${siteId}/support`), { default: () => [] })
useHead({ title: 'Support · Slate' })

const openId = ref<string | null>(typeof route.query.ticket === 'string' ? route.query.ticket : null)
const current = ref<SupportTicket | null>(null)
const busy = ref(false)
const error = ref('')
async function openTicket(id: string) {
    openId.value = id
    error.value = ''
    current.value = await $fetch<SupportTicket>(`/api/sites/${siteId}/support/${id}`).catch(() => null)
    navigateTo({ query: { ticket: id } }, { replace: true })
    // Opening it marks Slate's reply as read: update the list and the sidebar badge
    await refresh()
    refreshNuxtData(`support-unread-${siteId}`)
}
onMounted(() => openId.value && openTicket(openId.value))

async function run(fn: () => Promise<SupportTicket>) {
    busy.value = true
    error.value = ''
    try {
        current.value = await fn()
        await refresh()
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t send. Please try again.'
    } finally {
        busy.value = false
    }
}
const reply = (body: string) => run(() => $fetch(`/api/sites/${siteId}/support/${current.value!.id}/messages`, { method: 'POST', body: { body } }))
const close = () => run(() => $fetch(`/api/sites/${siteId}/support/${current.value!.id}/close`, { method: 'POST' }))

const writing = ref(false)
const subject = ref('')
const message = ref('')
const category = ref<TicketCategory | null>(null)
const severity = ref<TicketSeverity | null>(null)
const answers = reactive<Record<string, string>>({})
const cat = computed(() => findTicketCategory(category.value))
function startWriting() {
    writing.value = true
    category.value = null
    severity.value = null
    for (const k of Object.keys(answers)) delete answers[k]
}
function pick(c: TicketCategory) {
    category.value = c
    severity.value = null
    error.value = ''
}
async function create() {
    await run(() => $fetch(`/api/sites/${siteId}/support`, { method: 'POST', body: { subject: subject.value, body: message.value, category: category.value, severity: severity.value, answers } }))
    if (!error.value && current.value) {
        writing.value = false
        category.value = null
        subject.value = ''
        message.value = ''
        openId.value = current.value.id
        navigateTo({ query: { ticket: current.value.id } }, { replace: true })
    }
}
function back() {
    openId.value = null
    current.value = null
    navigateTo({ query: {} }, { replace: true })
}

const statusLook = {
    open: { label: 'Waiting for Slate', cls: 'open' },
    answered: { label: 'Slate replied', cls: 'answered' },
    closed: { label: 'Solved', cls: 'closed' }
} as const
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Support</h1>
            <button v-if="!writing && !current" class="btn btn-dark" type="button" @click="startWriting">Ask a question</button>
        </div>
        <p class="lead">Stuck, or found something that isn’t working? Ask here and the Slate team will reply, usually within a working day. You’ll get our reply by email too.</p>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <section v-if="writing && !cat" class="panel box" aria-labelledby="pick-h">
            <h2 id="pick-h">What do you need help with?</h2>
            <div class="types">
                <button v-for="c in TICKET_CATEGORIES" :key="c.key" type="button" class="type" :style="{ '--tbg': c.colour.bg, '--tfg': c.colour.fg }" @click="pick(c.key)">
                    <span class="ticon"><svg width="22" height="22" viewBox="0 0 18 18" aria-hidden="true"><path :d="c.icon" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                    <b>{{ c.name }}</b>
                    <span class="muted">{{ c.desc }}</span>
                </button>
            </div>
            <button class="btn btn-plain self-start" type="button" @click="writing = false">Cancel</button>
        </section>

        <form v-if="writing && cat" class="panel box" @submit.prevent="create">
            <div class="form-head">
                <TicketTags :category="cat.key" :severity="severity" />
                <button class="btn btn-plain btn-sm" type="button" @click="category = null">Change type</button>
            </div>
            <fieldset v-if="cat.key === 'bug'" class="sev-pick">
                <legend>How bad is it?</legend>
                <label v-for="s in TICKET_SEVERITIES" :key="s.key" class="sev-opt" :class="{ on: severity === s.key }">
                    <input v-model="severity" type="radio" name="severity" :value="s.key" required>
                    <span class="sev-badge" :style="{ background: s.colour.bg, color: s.colour.fg }">{{ s.key.toUpperCase() }}</span>
                    <span><b>{{ s.name.split(', ')[1] }}</b><span class="muted"> · {{ s.desc }}</span></span>
                </label>
            </fieldset>
            <div class="field"><label for="st-subject">Subject</label><input id="st-subject" v-model="subject" class="inp" type="text" maxlength="160" :placeholder="cat.key === 'bug' ? 'e.g. Contact form won’t send' : cat.key === 'feature' ? 'e.g. Price list block' : 'A few words about it'" required></div>
            <div v-for="q in cat.questions" :key="q.key" class="field">
                <label :for="`st-${q.key}`">{{ q.label }}</label>
                <select v-if="q.kind === 'select'" :id="`st-${q.key}`" v-model="answers[q.key]" class="inp" :required="q.required">
                    <option :value="undefined" disabled>Choose…</option>
                    <option v-for="o in q.options" :key="o" :value="o">{{ o }}</option>
                </select>
                <textarea v-else-if="q.kind === 'textarea'" :id="`st-${q.key}`" v-model="answers[q.key]" class="inp" rows="3" maxlength="2000" :placeholder="q.placeholder" :required="q.required" />
                <input v-else :id="`st-${q.key}`" v-model="answers[q.key]" class="inp" type="text" maxlength="300" :placeholder="q.placeholder" :required="q.required">
            </div>
            <div class="field">
                <label for="st-body">{{ cat.moreLabel }}</label>
                <textarea id="st-body" v-model="message" class="inp" rows="4" maxlength="5000" />
            </div>
            <div class="row">
                <button class="btn btn-dark" type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Send to Slate' }}</button>
                <button class="btn btn-plain" type="button" @click="writing = false">Cancel</button>
            </div>
        </form>

        <section v-if="current" class="panel box" :aria-label="current.subject">
            <button class="btn btn-plain btn-sm back" type="button" @click="back">← All questions</button>
            <div class="t-head">
                <span class="t-title"><h2>{{ current.subject }}</h2><TicketTags :category="current.category" :severity="current.severity" /></span>
                <span class="tag" :class="statusLook[current.status].cls">{{ statusLook[current.status].label }}</span>
            </div>
            <SupportThread :ticket="current" side="customer" :busy="busy" @reply="reply" @close="close" />
        </section>

        <section v-else-if="!writing" class="panel" aria-label="Your questions">
            <ul v-if="tickets.length" class="list">
                <li v-for="t in tickets" :key="t.id">
                    <button type="button" class="t-row" :class="{ unread: t.unread }" @click="openTicket(t.id)">
                        <span class="t-main"><b><span v-if="t.unread" class="dot" aria-hidden="true" />{{ t.subject }}<span v-if="t.unread" class="visually-hidden"> (new reply from Slate)</span></b><TicketTags :category="t.category" :severity="t.severity" /><span class="muted">{{ t.openedByName }} · {{ t.messages }} {{ t.messages === 1 ? 'message' : 'messages' }} · {{ formatWhen(t.updatedAt) }}</span></span>
                        <span class="tag" :class="statusLook[t.status].cls">{{ statusLook[t.status].label }}</span>
                    </button>
                </li>
            </ul>
            <p v-else class="muted empty">No questions yet. Press Ask a question whenever you need a hand.</p>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: -8px 0 0; max-width: 46em; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.inp { font-size: 15px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
.back { align-self: flex-start; }
.t-head { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.list { list-style: none; margin: 0; padding: 0; }
.list li + li { border-top: 1px solid var(--line-soft); }
.t-row { align-items: center; background: none; border: 0; color: inherit; cursor: pointer; display: flex; font: inherit; gap: 12px; justify-content: space-between; padding: 14px 20px; text-align: left; width: 100%; }
.t-row:hover { background: #fafbfc; }
.t-row.unread { background: #fffaf0; }
.dot { background: var(--lichen); border-radius: 50%; display: inline-block; height: 9px; margin-right: 8px; vertical-align: middle; width: 9px; }
.t-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tag { border-radius: 999px; flex: none; font-size: 12px; font-weight: 700; padding: 3px 10px; white-space: nowrap; }
.tag.open { background: #eef1f7; color: #3b4a6b; }
.tag.answered { background: #fff3de; color: #8a5300; }
.tag.closed { background: var(--mist); color: var(--text-muted); }
.empty { margin: 0; padding: 20px; }
.types { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
.type { align-items: flex-start; background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius-lg); color: var(--quarry); cursor: pointer; display: flex; flex-direction: column; font: inherit; gap: 4px; padding: 14px; text-align: left; }
.type:hover { border-color: var(--tfg); box-shadow: 0 0 0 3px var(--tbg); }
.type .muted { font-size: 13px; }
.ticon { align-items: center; background: var(--tbg); border-radius: 10px; color: var(--tfg); display: inline-flex; height: 38px; justify-content: center; margin-bottom: 6px; width: 38px; }
.self-start { align-self: flex-start; }
.form-head { align-items: center; display: flex; justify-content: space-between; }
.sev-pick { border: 0; display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; }
.sev-pick legend { font-size: 14px; font-weight: 600; margin-bottom: 6px; padding: 0; }
.sev-opt { align-items: center; border: 1.5px solid var(--line); border-radius: var(--radius); cursor: pointer; display: flex; font-size: 14px; gap: 10px; padding: 10px 12px; }
.sev-opt.on { border-color: var(--quarry); box-shadow: 0 0 0 2px var(--mist); }
.sev-opt input { accent-color: var(--quarry); }
.sev-badge { border-radius: 999px; flex: none; font-size: 11px; font-weight: 800; padding: 2px 8px; }
.t-title { display: flex; flex-direction: column; gap: 6px; }
</style>
