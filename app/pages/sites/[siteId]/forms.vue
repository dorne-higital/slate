<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

type FormSummary = FormDefinition & { total: number, unread: number, todo: number }
interface Reply { id: string, formId: string, data: Record<string, string>, pagePath: string | null, read: boolean, done: boolean, note: string, createdAt: string }

const { data: forms, refresh: refreshForms } = await useAsyncData(`forms-${siteId}`, () => fetcher<FormSummary[]>(`/api/sites/${siteId}/forms`))
useHead({ title: 'Forms · Slate' })

const role = computed(() => me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer')
const canEdit = computed(() => ROLE_RANK[role.value] >= ROLE_RANK.editor)
const canDelete = computed(() => ROLE_RANK[role.value] >= ROLE_RANK.admin)

const formId = ref<string | null>(forms.value?.[0]?.id ?? null)
const filter = ref<'todo' | 'done' | 'all'>('todo')
const editing = ref(false)
const current = computed(() => forms.value?.find(f => f.id === formId.value) ?? null)

const { data: replies, refresh: refreshReplies, status: repliesStatus } = await useAsyncData(
    () => `replies-${formId.value}-${filter.value}`,
    () => formId.value ? fetcher<Reply[]>(`/api/sites/${siteId}/forms/${formId.value}/replies`, { query: { status: filter.value } }) : Promise.resolve([]),
    { watch: [formId, filter] }
)
const selectedId = ref<string | null>(null)
const selected = computed(() => replies.value?.find(r => r.id === selectedId.value) ?? null)
watch(formId, () => {
    selectedId.value = null
    editing.value = false
})

const note = ref('')
let noteTimer: ReturnType<typeof setTimeout> | undefined

async function open(reply: Reply) {
    selectedId.value = reply.id
    note.value = reply.note
    if (!reply.read) {
        reply.read = true
        await $fetch(`/api/sites/${siteId}/replies/${reply.id}`, { method: 'PATCH', body: { read: true } }).catch(() => {})
        refreshForms()
    }
}

// Each reply's state, shown as a label: done wins, then unread, else read
const stateOf = (r: Reply) => r.done ? { key: 'done', label: 'Done' } : r.read ? { key: 'read', label: 'Read' } : { key: 'unread', label: 'Unread' }

async function markUnread(reply: Reply) {
    reply.read = false
    selectedId.value = null
    await $fetch(`/api/sites/${siteId}/replies/${reply.id}`, { method: 'PATCH', body: { read: false } }).catch(() => {})
    refreshForms()
}

async function toggleDone(reply: Reply) {
    const updated = await $fetch<Reply>(`/api/sites/${siteId}/replies/${reply.id}`, { method: 'PATCH', body: { done: !reply.done } })
    Object.assign(reply, updated)
    if (filter.value !== 'all') {
        selectedId.value = null
        await refreshReplies()
    }
    refreshForms()
}

async function removeReply(reply: Reply) {
    await $fetch(`/api/sites/${siteId}/replies/${reply.id}`, { method: 'DELETE' })
    selectedId.value = null
    await Promise.all([refreshReplies(), refreshForms()])
}

function onNote() {
    clearTimeout(noteTimer)
    const reply = selected.value
    if (!reply) return
    noteTimer = setTimeout(async () => {
        const updated = await $fetch<Reply>(`/api/sites/${siteId}/replies/${reply.id}`, { method: 'PATCH', body: { note: note.value } })
        reply.note = updated.note
    }, 600)
}

async function newForm() {
    const created = await $fetch<FormSummary>(`/api/sites/${siteId}/forms`, { method: 'POST', body: { name: 'New form' } })
    await refreshForms()
    formId.value = created.id
    editing.value = true
}

async function onSaved() {
    await refreshForms()
    editing.value = false
}
async function onDeleted() {
    await refreshForms()
    formId.value = forms.value?.[0]?.id ?? null
    editing.value = false
}

const emailOf = (r: Reply) => Object.values(r.data).find(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
const nameOf = (r: Reply) => {
    const entry = Object.entries(r.data).find(([k]) => /name/i.test(k))
    return entry?.[1] || emailOf(r) || 'Someone'
}
const previewOf = (r: Reply) => {
    const entry = Object.entries(r.data).find(([k, v]) => /message|details|what|tell/i.test(k) && v) ?? Object.entries(r.data).at(-1)
    return entry?.[1] ?? ''
}
const sentAt = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Forms</h1>
            <div class="row">
                <button v-if="current && canEdit && !editing" class="btn btn-ghost" type="button" @click="editing = true">Edit form</button>
                <button v-if="canEdit" class="btn btn-dark" type="button" @click="newForm">New form</button>
            </div>
        </div>

        <div v-if="!forms?.length" class="panel empty">
            <b>No forms yet</b>
            <span class="muted">Make a form, then add it to a page with the Form block. Replies arrive here.</span>
        </div>

        <template v-else>
            <div class="bar">
                <div class="seg" role="group" aria-label="Choose form">
                    <button v-for="f in forms" :key="f.id" type="button" :class="{ on: formId === f.id }" :aria-pressed="formId === f.id" @click="formId = f.id">
                        {{ f.name }}<span v-if="f.unread" class="count" :aria-label="`${f.unread} new`">{{ f.unread }}</span>
                    </button>
                </div>
                <div v-if="!editing" class="seg" role="group" aria-label="Filter replies">
                    <button v-for="x in ([['todo', 'To do'], ['done', 'Done'], ['all', 'All']] as const)" :key="x[0]" type="button" :class="{ on: filter === x[0] }" :aria-pressed="filter === x[0]" @click="filter = x[0]">{{ x[1] }}</button>
                </div>
            </div>

            <FormEditor v-if="editing && current" :key="current.id" :site-id="siteId" :form="current" :can-delete="canDelete" @saved="onSaved" @deleted="onDeleted" @close="editing = false" />

            <div v-else class="inbox">
                <section class="panel list" aria-label="Replies">
                    <div class="list-head">
                        <span class="muted">{{ current?.total ?? 0 }} {{ current?.total === 1 ? 'reply' : 'replies' }}, {{ current?.unread ?? 0 }} new</span>
                        <a v-if="current?.total" :href="`/api/sites/${siteId}/forms/${formId}/replies.csv`" class="dl">Download as CSV</a>
                    </div>
                    <button v-for="r in replies" :key="r.id" type="button" class="item" :class="{ sel: r.id === selectedId }" @click="open(r)">
                        <i v-if="!r.read" class="dot" aria-label="Unread" />
                        <i v-else class="dot-space" aria-hidden="true" />
                        <span class="item-text">
                            <span class="item-top"><b :class="{ unread: !r.read }">{{ nameOf(r) }}</b><span class="muted">{{ formatWhen(r.createdAt) }}</span></span>
                            <span class="item-bottom"><span class="snippet">{{ previewOf(r) }}</span><span class="state" :class="stateOf(r).key">{{ stateOf(r).label }}</span></span>
                        </span>
                    </button>
                    <p v-if="!replies?.length && repliesStatus !== 'pending'" class="none muted">
                        {{ filter === 'todo' ? 'Nothing to do. New replies will appear here.' : filter === 'done' ? 'Nothing marked as done yet.' : 'No replies yet.' }}
                    </p>
                </section>

                <article v-if="selected" class="panel detail" aria-labelledby="r-h">
                    <div class="detail-head">
                        <div class="detail-title">
                            <h2 id="r-h">{{ nameOf(selected) }} <span class="state" :class="stateOf(selected).key">{{ stateOf(selected).label }}</span></h2>
                            <span class="muted">Sent through {{ current?.name }}{{ selected.pagePath ? ` on ${selected.pagePath}` : '' }}, {{ sentAt(selected.createdAt) }}</span>
                        </div>
                        <div class="row">
                            <a v-if="emailOf(selected)" class="btn btn-dark" :href="`mailto:${emailOf(selected)}`">Reply by email</a>
                            <button v-if="canEdit" class="btn btn-ghost" type="button" @click="toggleDone(selected)">{{ selected.done ? 'Move back to to do' : 'Mark as done' }}</button>
                            <button v-if="!selected.done" class="btn btn-plain" type="button" @click="markUnread(selected)">Mark as unread</button>
                            <button v-if="canEdit" class="ib" type="button" aria-label="Delete reply" @click="removeReply(selected)">
                                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 4h12M7 4V2.5h4V4M4.5 4l.7 11.5h7.6l.7-11.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </button>
                        </div>
                    </div>
                    <dl class="answers">
                        <template v-for="(v, k) in selected.data" :key="k">
                            <dt>{{ k }}</dt>
                            <dd>
                                <a v-if="v === emailOf(selected)" :href="`mailto:${v}`">{{ v }}</a>
                                <span v-else>{{ v }}</span>
                            </dd>
                        </template>
                    </dl>
                    <div v-if="canEdit" class="note">
                        <label for="note">Private note</label>
                        <textarea id="note" v-model="note" class="inp" rows="3" placeholder="Only people on your team can see this" @input="onNote" />
                    </div>
                </article>
                <div v-else class="panel detail placeholder muted">Pick a reply to read it.</div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.bar { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; display: inline-flex; font-family: inherit; font-size: 14px; font-weight: 600; gap: 6px; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.count { background: var(--lichen); border-radius: 999px; color: var(--quarry); font-size: 12px; font-weight: 700; padding: 1px 8px; }
.empty { display: flex; flex-direction: column; gap: 6px; padding: 40px; text-align: center; }

.inbox { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(280px, 380px) minmax(0, 1fr); }
.list { overflow: hidden; }
.list-head { align-items: center; display: flex; justify-content: space-between; padding: 12px 16px; }
.dl { font-size: 14px; font-weight: 600; }
.item { background: var(--white); border: 0; border-top: 1px solid var(--line-soft); color: var(--quarry); cursor: pointer; display: flex; font-family: inherit; gap: 10px; padding: 14px 16px; text-align: left; width: 100%; }
.item:hover { background: #fafbfc; }
.item.sel { background: #f1f3f6; box-shadow: inset 3px 0 0 var(--quarry); }
.dot { background: var(--lichen); border-radius: 50%; flex: none; height: 8px; margin-top: 7px; width: 8px; }
.dot-space { flex: none; width: 8px; }
.item-text { display: flex; flex: 1; flex-direction: column; gap: 3px; min-width: 0; }
.item-top { display: flex; gap: 8px; justify-content: space-between; }
.item-top b { font-size: 15px; font-weight: 600; }
.item-top b.unread { font-weight: 800; }
.item-bottom { align-items: center; display: flex; gap: 10px; justify-content: space-between; min-width: 0; }
.item-bottom .snippet { flex: 1; min-width: 0; }
.state { border-radius: 999px; display: inline-block; flex: none; font-size: 11.5px; font-weight: 700; letter-spacing: .01em; padding: 2px 8px; vertical-align: middle; }
h2 .state { font-size: 12px; margin-left: 6px; position: relative; top: -3px; }
.state.unread { background: var(--lichen); color: var(--quarry); }
.state.read { background: var(--mist); color: var(--text-muted); }
.state.done { background: color-mix(in srgb, var(--ok) 16%, transparent); color: var(--ok-text); }
.snippet { color: var(--text-body); font-size: 14px; line-height: 1.45; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.none { margin: 0; padding: 20px 16px; }

.detail { display: flex; flex-direction: column; gap: 22px; padding: 24px 28px; }
.placeholder { align-items: center; justify-content: center; min-height: 200px; }
.detail-head { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.detail-title { display: flex; flex-direction: column; gap: 4px; }
h2 { font-size: 22px; font-weight: 800; letter-spacing: -.02em; margin: 0; }
.answers { column-gap: 20px; display: grid; font-size: 15px; grid-template-columns: 160px minmax(0, 1fr); margin: 0; row-gap: 14px; }
.answers dt { color: var(--text-muted); font-size: 14px; }
.answers dd { line-height: 1.6; margin: 0; max-width: 36em; white-space: pre-wrap; word-break: break-word; }
.note { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 8px; padding-top: 20px; }
.note label { font-size: 14px; font-weight: 600; }
.note .inp { font-size: 15px; height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; height: 40px; justify-content: center; width: 40px; }
.ib:hover { background: var(--mist); }

@media (max-width: 960px) {
    .inbox { grid-template-columns: minmax(0, 1fr); }
    .answers { grid-template-columns: minmax(0, 1fr); row-gap: 4px; }
    .answers dd { margin-bottom: 10px; }
}
</style>
