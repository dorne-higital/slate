<script setup lang="ts">
// One support conversation. `side` decides whose messages sit on the right and the wording.
export interface SupportTicket {
    id: string
    siteId: string
    siteName: string
    subject: string
    status: 'open' | 'answered' | 'closed'
    category: TicketCategory
    severity: TicketSeverity | null
    createdAt: string
    updatedAt: string
    openedByName: string | null
    openedByEmail: string | null
    messages: { id: string, body: string, fromSlate: boolean, authorName: string | null, createdAt: string }[]
}
const props = defineProps<{ ticket: SupportTicket, side: 'customer' | 'slate', busy?: boolean }>()
const emit = defineEmits<{ reply: [body: string], close: [], reopen: [] }>()
const draft = ref('')
watch(() => props.ticket.messages.length, () => (draft.value = ''))
const mine = (m: SupportTicket['messages'][number]) => props.side === 'slate' ? m.fromSlate : !m.fromSlate
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
</script>

<template>
    <div class="thread">
        <ol class="msgs" aria-label="Messages">
            <li v-for="m in ticket.messages" :key="m.id" class="msg" :class="{ mine: mine(m), slate: m.fromSlate }">
                <span class="meta"><b>{{ m.authorName ?? 'Someone' }}</b> · {{ when(m.createdAt) }}</span>
                <p class="body">{{ m.body }}</p>
            </li>
        </ol>
        <form class="reply" @submit.prevent="emit('reply', draft)">
            <label class="visually-hidden" :for="`reply-${ticket.id}`">Your reply</label>
            <textarea :id="`reply-${ticket.id}`" v-model="draft" class="inp" rows="4" maxlength="5000" :placeholder="side === 'slate' ? `Reply to ${ticket.openedByName ?? 'the customer'}. They’ll get it by email.` : ticket.status === 'closed' ? 'Write to reopen this ticket' : 'Add a reply'" />
            <div class="row">
                <button class="btn btn-dark" type="submit" :disabled="busy || !draft.trim()">{{ busy ? 'Sending…' : 'Send reply' }}</button>
                <button v-if="ticket.status !== 'closed'" class="btn btn-plain" type="button" :disabled="busy" @click="emit('close')">{{ side === 'slate' ? 'Close ticket' : 'Mark as solved' }}</button>
                <button v-else-if="side === 'slate'" class="btn btn-plain" type="button" :disabled="busy" @click="emit('reopen')">Reopen</button>
            </div>
        </form>
    </div>
</template>

<style scoped>
.thread { display: flex; flex-direction: column; gap: 16px; }
.msgs { display: flex; flex-direction: column; gap: 12px; list-style: none; margin: 0; padding: 0; }
.msg { align-self: flex-start; background: var(--paper); border-radius: 12px 12px 12px 4px; display: flex; flex-direction: column; gap: 4px; max-width: min(80%, 640px); padding: 12px 14px; }
.msg.mine { align-self: flex-end; background: #eef1f7; border-radius: 12px 12px 4px 12px; }
.msg.slate .meta b::after { background: var(--lichen); border-radius: 999px; color: var(--quarry); content: 'Slate'; font-size: 10px; margin-left: 6px; padding: 1px 6px; }
.meta { color: var(--text-muted); font-size: 12px; }
.meta b { color: var(--quarry); }
.body { color: var(--text-body); font-size: 15px; line-height: 1.55; margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.reply { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 10px; padding-top: 14px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.row { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
