<script setup lang="ts">
import type { SupportTicket } from '~/components/SupportThread.vue'

definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
type TicketRow = Omit<SupportTicket, 'messages'> & { messages: number }

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
async function create() {
    await run(() => $fetch(`/api/sites/${siteId}/support`, { method: 'POST', body: { subject: subject.value, body: message.value } }))
    if (!error.value && current.value) {
        writing.value = false
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
            <button v-if="!writing && !current" class="btn btn-dark" type="button" @click="writing = true">Ask a question</button>
        </div>
        <p class="lead">Stuck, or found something that isn’t working? Ask here and the Slate team will reply, usually within a working day. You’ll get our reply by email too.</p>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <form v-if="writing" class="panel box" @submit.prevent="create">
            <h2>Ask a question</h2>
            <div class="field"><label for="st-subject">Subject</label><input id="st-subject" v-model="subject" class="inp" type="text" maxlength="160" placeholder="e.g. My domain isn’t working" required></div>
            <div class="field">
                <label for="st-body">What’s happening?</label>
                <textarea id="st-body" v-model="message" class="inp" rows="6" maxlength="5000" required placeholder="Tell us what you were trying to do, and which page it’s on." />
            </div>
            <div class="row">
                <button class="btn btn-dark" type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Send to Slate' }}</button>
                <button class="btn btn-plain" type="button" @click="writing = false">Cancel</button>
            </div>
        </form>

        <section v-if="current" class="panel box" :aria-label="current.subject">
            <button class="btn btn-plain btn-sm back" type="button" @click="back">← All questions</button>
            <div class="t-head">
                <h2>{{ current.subject }}</h2>
                <span class="tag" :class="statusLook[current.status].cls">{{ statusLook[current.status].label }}</span>
            </div>
            <SupportThread :ticket="current" side="customer" :busy="busy" @reply="reply" @close="close" />
        </section>

        <section v-else-if="!writing" class="panel" aria-label="Your questions">
            <ul v-if="tickets.length" class="list">
                <li v-for="t in tickets" :key="t.id">
                    <button type="button" class="t-row" @click="openTicket(t.id)">
                        <span class="t-main"><b>{{ t.subject }}</b><span class="muted">{{ t.openedByName }} · {{ t.messages }} {{ t.messages === 1 ? 'message' : 'messages' }} · {{ formatWhen(t.updatedAt) }}</span></span>
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
.t-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tag { border-radius: 999px; flex: none; font-size: 12px; font-weight: 700; padding: 3px 10px; white-space: nowrap; }
.tag.open { background: #eef1f7; color: #3b4a6b; }
.tag.answered { background: #fff3de; color: #8a5300; }
.tag.closed { background: var(--mist); color: var(--text-muted); }
.empty { margin: 0; padding: 20px; }
</style>
