<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()

const { data: pages } = await useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`))
useHead({ title: 'Pages · Slate' })

type Filter = 'all' | 'published' | 'changed' | 'draft'
const filter = ref<Filter>('all')
const search = ref('')

const counts = computed(() => {
    const list = pages.value ?? []
    return {
        all: list.length,
        published: list.filter(p => p.status === 'published' && !p.hasUnpublishedChanges).length,
        changed: list.filter(p => p.hasUnpublishedChanges).length,
        draft: list.filter(p => p.status === 'draft').length
    }
})

const shown = computed(() => {
    const q = search.value.trim().toLowerCase()
    return (pages.value ?? []).filter((p) => {
        if (filter.value === 'published' && (p.status !== 'published' || p.hasUnpublishedChanges)) return false
        if (filter.value === 'changed' && !p.hasUnpublishedChanges) return false
        if (filter.value === 'draft' && p.status !== 'draft') return false
        return !q || p.title.toLowerCase().includes(q) || p.path.includes(q)
    })
})

const home = computed(() => pages.value?.find(p => p.path === '/'))

// ── Drag to reorder (siblings only: pages with the same parent). Only with no filter or search. ──
const { me } = useMe()
const canReorder = computed(() => filter.value === 'all' && !search.value.trim() && ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)
const parentOf = (path: string) => path === '/' ? null : path.split('/').slice(0, -1).join('/') || '/'
const dragId = ref<string | null>(null)
const dropTarget = ref<{ id: string, after: boolean } | null>(null)
const orderError = ref('')
function onDragOver(e: DragEvent, p: PageListItem) {
    const from = pages.value?.find(x => x.id === dragId.value)
    if (!from || from.id === p.id || p.path === '/' || parentOf(from.path) !== parentOf(p.path)) {
        dropTarget.value = null
        return
    }
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dropTarget.value = { id: p.id, after: e.clientY > rect.top + rect.height / 2 }
}
async function onDrop() {
    const target = dropTarget.value
    const fromId = dragId.value
    dragId.value = null
    dropTarget.value = null
    if (!target || !fromId || !pages.value) return
    const before = pages.value
    const list = before.filter(p => p.id !== fromId)
    const at = list.findIndex(p => p.id === target.id) + (target.after ? 1 : 0)
    list.splice(at, 0, before.find(p => p.id === fromId)!)
    pages.value = list
    orderError.value = ''
    try {
        await $fetch(`/api/sites/${siteId}/pages/order`, { method: 'POST', body: { ids: list.map(p => p.id) } })
    } catch (err) {
        pages.value = before
        orderError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save the new order. Please try again.'
    }
}
const depth = (path: string) => path === '/' ? 0 : path.split('/').length - 2
const filters: { key: Filter, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'changed', label: 'Unpublished changes' },
    { key: 'draft', label: 'Drafts' }
]
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Pages</h1>
            <NuxtLink v-if="home" class="btn btn-dark" :to="`/sites/${siteId}/pages/${home.id}`">Open the editor</NuxtLink>
        </div>

        <div class="tools">
            <div class="seg" role="group" aria-label="Filter pages">
                <button v-for="f in filters" :key="f.key" type="button" :class="{ on: filter === f.key }" :aria-pressed="filter === f.key" @click="filter = f.key">
                    {{ f.label }} {{ counts[f.key] }}
                </button>
            </div>
            <label class="search">
                <span class="visually-hidden">Search pages</span>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><circle cx="8" cy="8" r="5" fill="none" stroke="#555C6E" stroke-width="1.6" /><path d="M12 12l4 4" stroke="#555C6E" stroke-width="1.6" stroke-linecap="round" /></svg>
                <input v-model="search" class="inp" type="search" placeholder="Search pages">
            </label>
        </div>

        <p v-if="orderError" class="error-box" role="alert">{{ orderError }}</p>
        <p v-if="canReorder" class="muted small">Drag pages by the handle to change their order. Your automatic menu follows it.</p>
        <section class="panel scroll" aria-label="All pages">
            <table class="tbl">
                <thead><tr><th scope="col">Page</th><th scope="col">Status</th><th scope="col">Last edited</th><th scope="col">By</th></tr></thead>
                <tbody>
                    <tr
                        v-for="p in shown"
                        :key="p.id"
                        :class="{ dragging: dragId === p.id, 'drop-before': dropTarget?.id === p.id && !dropTarget.after, 'drop-after': dropTarget?.id === p.id && dropTarget.after }"
                        @dragover="onDragOver($event, p)"
                        @drop.prevent="onDrop"
                    >
                        <td :style="{ paddingLeft: `${20 + depth(p.path) * 24}px` }">
                            <span class="pg">
                                <span
                                    v-if="canReorder && p.path !== '/'"
                                    class="handle"
                                    draggable="true"
                                    title="Drag to reorder"
                                    aria-hidden="true"
                                    @dragstart="dragId = p.id; $event.dataTransfer?.setData('text/plain', p.id)"
                                    @dragend="dragId = null; dropTarget = null"
                                >⠿</span><NuxtLink class="rl" :to="`/sites/${siteId}/pages/${p.id}`">{{ p.title }}</NuxtLink><span class="muted">{{ p.path }}</span></span>
                        </td>
                        <td><StatusPill :status="p.status" :changed="p.hasUnpublishedChanges" /></td>
                        <td class="muted">{{ formatWhen(p.updatedAt) }}</td>
                        <td class="muted">{{ p.updatedByName?.split(' ')[0] ?? '' }}</td>
                    </tr>
                    <tr v-if="!shown.length"><td colspan="4" class="muted">No pages match.</td></tr>
                </tbody>
            </table>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.tools { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }

.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }

.search { flex: 1 1 240px; max-width: 360px; position: relative; }
.search svg { left: 12px; position: absolute; top: 15px; }
.search .inp { height: 48px; padding-left: 38px; }

.scroll { overflow-x: auto; }
.pg { display: flex; flex-direction: column; gap: 1px; }
.rl { color: var(--quarry); font-weight: 600; text-decoration: none; }
.rl:hover { text-decoration: underline; }
.small { font-size: 13px; margin: -12px 0 0; }
.handle { color: var(--text-muted); cursor: grab; font-size: 16px; line-height: 1; margin-right: 8px; user-select: none; }
.handle:active { cursor: grabbing; }
tr.dragging td { opacity: .45; }
tr.drop-before td { box-shadow: inset 0 3px 0 var(--quarry); }
tr.drop-after td { box-shadow: inset 0 -3px 0 var(--quarry); }
</style>
