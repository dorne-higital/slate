<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

const { data: allRows } = await useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`, { query: { projects: '1' } }))
// System pages (404…) get their own section; everything else is the tree
const pages = computed({
    get: () => (allRows.value ?? []).filter(p => p.kind !== 'system'),
    set: v => (allRows.value = [...v, ...systemRows.value])
})
const systemRows = computed(() => (allRows.value ?? []).filter(p => p.kind === 'system'))
const systemInfo = (p: PageListItem) => systemPageFor(p.path)
useHead({ title: 'Pages · Slate' })

type Filter = 'all' | 'published' | 'changed' | 'draft'
const filter = ref<Filter>('all')
const search = ref('')
const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)

const counts = computed(() => {
    const list = pages.value ?? []
    return {
        all: list.length,
        published: list.filter(p => p.status === 'published' && !p.hasUnpublishedChanges).length,
        changed: list.filter(p => p.hasUnpublishedChanges).length,
        draft: list.filter(p => p.status === 'draft').length
    }
})
const filters: { key: Filter, label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'published', label: 'Published' },
    { key: 'changed', label: 'Unpublished changes' },
    { key: 'draft', label: 'Drafts' }
]
const home = computed(() => pages.value?.find(p => p.path === '/'))

// ── Tree: children sit under their parent, collapsed until opened ──
const childrenOf = computed(() => {
    const map = new Map<string | null, PageListItem[]>()
    const ids = new Set((pages.value ?? []).map(p => p.id))
    for (const p of pages.value ?? []) {
        // A page whose parent is gone shows at the top level rather than vanishing
        const parent = p.parentId && ids.has(p.parentId) ? p.parentId : null
        if (!map.has(parent)) map.set(parent, [])
        map.get(parent)!.push(p)
    }
    return map
})
const expanded = ref(new Set<string>())
function toggle(id: string) {
    const next = new Set(expanded.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expanded.value = next
}
const allOpen = computed(() => [...childrenOf.value.keys()].filter(Boolean).every(id => expanded.value.has(id!)))
const toggleAll = () => (expanded.value = allOpen.value ? new Set() : new Set([...childrenOf.value.keys()].filter(Boolean) as string[]))

interface Row { page: PageListItem, depth: number, kids: number }
const searching = computed(() => filter.value !== 'all' || !!search.value.trim())
const rows = computed<Row[]>(() => {
    const out: Row[] = []
    const depthOf = (p: PageListItem) => {
        let d = 0
        let cur = p
        const byId = new Map((pages.value ?? []).map(x => [x.id, x]))
        while (cur.parentId && byId.has(cur.parentId) && d < 20) {
            cur = byId.get(cur.parentId)!
            d++
        }
        return d
    }
    if (searching.value) {
        // Filtering: every match, flat, still indented so you can see where it lives
        const q = search.value.trim().toLowerCase()
        for (const p of pages.value ?? []) {
            if (filter.value === 'published' && (p.status !== 'published' || p.hasUnpublishedChanges)) continue
            if (filter.value === 'changed' && !p.hasUnpublishedChanges) continue
            if (filter.value === 'draft' && p.status !== 'draft') continue
            if (q && !p.title.toLowerCase().includes(q) && !p.path.includes(q)) continue
            out.push({ page: p, depth: depthOf(p), kids: childrenOf.value.get(p.id)?.length ?? 0 })
        }
        return out
    }
    const walk = (parent: string | null, depth: number) => {
        for (const p of childrenOf.value.get(parent) ?? []) {
            const kids = childrenOf.value.get(p.id)?.length ?? 0
            out.push({ page: p, depth, kids })
            if (kids && expanded.value.has(p.id)) walk(p.id, depth + 1)
        }
    }
    walk(null, 0)
    return out
})

// ── New page ──
const adding = ref(false)
const newTitle = ref('')
const newParent = ref<string | null>(null)
const creating = ref(false)
const createError = ref('')
const parentOptions = computed(() => {
    const out: { id: string, label: string }[] = []
    const walk = (parent: string | null, depth: number) => {
        for (const p of childrenOf.value.get(parent) ?? []) {
            if (p.path !== '/' && p.kind !== 'project') out.push({ id: p.id, label: `${'— '.repeat(depth)}${p.title}` })
            walk(p.id, depth + 1)
        }
    }
    walk(null, 0)
    return out
})
function startAdd(parentId: string | null = null) {
    adding.value = true
    newParent.value = parentId
    newTitle.value = ''
    createError.value = ''
    nextTick(() => document.getElementById('np-title')?.focus())
}
async function createPage() {
    creating.value = true
    createError.value = ''
    try {
        const page = await $fetch<{ id: string }>(`/api/sites/${siteId}/pages`, { method: 'POST', body: { title: newTitle.value, parentId: newParent.value } })
        await navigateTo(`/sites/${siteId}/pages/${page.id}`)
    } catch (err) {
        createError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t create the page. Please try again.'
    } finally {
        creating.value = false
    }
}

// ── Drag to reorder among siblings (same parent). Not while filtering. ──
const canReorder = computed(() => !searching.value && canEdit.value)
const dragId = ref<string | null>(null)
const dropTarget = ref<{ id: string, after: boolean } | null>(null)
const orderError = ref('')
function onDragOver(e: DragEvent, p: PageListItem) {
    const from = pages.value?.find(x => x.id === dragId.value)
    if (!from || from.id === p.id || p.path === '/' || from.parentId !== p.parentId || from.kind === 'project' || p.kind === 'project') {
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
        await $fetch(`/api/sites/${siteId}/pages/order`, { method: 'POST', body: { ids: list.filter(p => p.kind !== 'project').map(p => p.id) } })
    } catch (err) {
        pages.value = before
        orderError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save the new order. Please try again.'
    }
}
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Pages</h1>
            <div class="head-actions">
                <NuxtLink v-if="home" class="btn btn-ghost" :to="`/sites/${siteId}/pages/${home.id}`">Open the editor</NuxtLink>
                <button v-if="canEdit && !adding" class="btn btn-dark" type="button" @click="startAdd()">New page</button>
            </div>
        </div>

        <form v-if="adding" class="panel add" @submit.prevent="createPage">
            <h2>New page</h2>
            <p v-if="createError" class="error-box" role="alert">{{ createError }}</p>
            <div class="add-row">
                <div class="field grow"><label for="np-title">Page title</label><input id="np-title" v-model="newTitle" class="inp" type="text" maxlength="120" placeholder="e.g. Upholstery" required></div>
                <div class="field">
                    <label for="np-parent">Put it under</label>
                    <select id="np-parent" v-model="newParent" class="inp">
                        <option :value="null">Nothing (a main page)</option>
                        <option v-for="o in parentOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <button class="btn btn-dark" type="submit" :disabled="creating">{{ creating ? 'Creating…' : 'Create and open' }}</button>
                <button class="btn btn-plain" type="button" @click="adding = false">Cancel</button>
                <span class="muted small-note">It starts as a draft, so visitors won’t see it until you publish.</span>
            </div>
        </form>

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
        <div v-if="!searching" class="list-tools">
            <span v-if="canReorder" class="muted">Drag pages by the handle to change their order. Your automatic menu follows it.</span>
            <button v-if="childrenOf.size > 1" class="btn btn-plain btn-sm" type="button" @click="toggleAll">{{ allOpen ? 'Collapse all' : 'Expand all' }}</button>
        </div>

        <section class="panel scroll" aria-label="All pages">
            <table class="tbl">
                <thead><tr><th scope="col">Page</th><th scope="col">Status</th><th scope="col">Last edited</th><th scope="col">By</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr></thead>
                <tbody>
                    <tr
                        v-for="r in rows"
                        :key="r.page.id"
                        :class="{ dragging: dragId === r.page.id, 'drop-before': dropTarget?.id === r.page.id && !dropTarget.after, 'drop-after': dropTarget?.id === r.page.id && dropTarget.after, child: r.depth > 0 }"
                        @dragover="onDragOver($event, r.page)"
                        @drop.prevent="onDrop"
                    >
                        <td>
                            <span class="pg" :style="{ paddingLeft: `${r.depth * 28}px` }">
                                <span
                                    v-if="canReorder && r.page.path !== '/' && r.page.kind !== 'project'"
                                    class="handle"
                                    draggable="true"
                                    title="Drag to reorder"
                                    aria-hidden="true"
                                    @dragstart="dragId = r.page.id; $event.dataTransfer?.setData('text/plain', r.page.id)"
                                    @dragend="dragId = null; dropTarget = null"
                                >⠿</span>
                                <span v-else-if="canReorder" class="handle-space" aria-hidden="true" />
                                <button
                                    v-if="r.kids && !searching"
                                    class="caret"
                                    :class="{ open: expanded.has(r.page.id) }"
                                    type="button"
                                    :aria-expanded="expanded.has(r.page.id)"
                                    :aria-label="`${expanded.has(r.page.id) ? 'Hide' : 'Show'} ${r.kids} ${r.kids === 1 ? 'page' : 'pages'} under ${r.page.title}`"
                                    @click="toggle(r.page.id)"
                                >
                                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                </button>
                                <span v-else class="caret-space" aria-hidden="true" />
                                <span class="pg-text">
                                    <span class="rl-row"><NuxtLink class="rl" :to="`/sites/${siteId}/pages/${r.page.id}`">{{ r.page.title }}</NuxtLink><NuxtLink v-if="r.page.kind === 'project'" class="kind" :to="`/sites/${siteId}/projects`" title="Cover, category and order are on the Projects screen">Project</NuxtLink></span>
                                    <span class="muted">{{ r.page.path }}<template v-if="r.kids && !expanded.has(r.page.id) && !searching"> · {{ r.kids }} {{ r.kids === 1 ? 'page' : 'pages' }} inside</template></span>
                                </span>
                            </span>
                        </td>
                        <td><StatusPill :status="r.page.status" :changed="r.page.hasUnpublishedChanges" /></td>
                        <td class="muted">{{ formatWhen(r.page.updatedAt) }}</td>
                        <td class="muted">{{ r.page.updatedByName?.split(' ')[0] ?? '' }}</td>
                        <td class="end">
                            <button v-if="canEdit && r.page.path !== '/' && r.page.kind !== 'project'" class="btn btn-plain btn-sm add-child" type="button" :aria-label="`Add a page under ${r.page.title}`" @click="startAdd(r.page.id)">+ Page inside</button>
                        </td>
                    </tr>
                    <tr v-if="!rows.length"><td colspan="5" class="muted">No pages match.</td></tr>
                </tbody>
            </table>
        </section>

        <section v-if="systemRows.length" class="panel sys" aria-labelledby="sys-h">
            <div class="sys-head">
                <h2 id="sys-h">System pages</h2>
                <span class="muted">Every site has these. Change what they say; they can’t be deleted or moved.</span>
            </div>
            <ul class="sys-list">
                <li v-for="p in systemRows" :key="p.id">
                    <span class="lock" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg></span>
                    <span class="sys-text">
                        <NuxtLink class="rl" :to="`/sites/${siteId}/pages/${p.id}`">{{ p.title }}</NuxtLink>
                        <span class="muted">{{ systemInfo(p)?.desc }}</span>
                    </span>
                    <StatusPill :status="p.status" :changed="p.hasUnpublishedChanges" />
                    <NuxtLink v-if="canEdit" class="btn btn-ghost btn-sm" :to="`/sites/${siteId}/pages/${p.id}`">Edit</NuxtLink>
                </li>
            </ul>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.head-actions { display: flex; flex-wrap: wrap; gap: 8px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.sys { display: flex; flex-direction: column; }
.sys-head { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px 12px; }
.sys-list { list-style: none; margin: 0; padding: 0; }
.sys-list li { align-items: center; border-top: 1px solid var(--line-soft); display: flex; flex-wrap: wrap; gap: 12px 16px; padding: 14px 20px; }
.lock { align-items: center; background: var(--mist); border-radius: 8px; color: var(--text-muted); display: flex; height: 30px; justify-content: center; width: 30px; }
.sys-text { display: flex; flex: 1 1 260px; flex-direction: column; gap: 2px; }
.rl-row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.kind { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 11.5px; font-weight: 700; padding: 2px 8px; text-decoration: none; }
.kind:hover { background: var(--line); color: var(--quarry); }
.add { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.add-row { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 12px; }
.grow { flex: 1 1 260px; }
.add .inp { font-size: 15px; height: 42px; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.small-note { font-size: 13px; }
.tools { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }

.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }

.search { flex: 1 1 240px; max-width: 360px; position: relative; }
.search svg { left: 12px; position: absolute; top: 15px; }
.search .inp { height: 48px; padding-left: 38px; }

.list-tools { align-items: center; display: flex; flex-wrap: wrap; font-size: 13px; gap: 12px; justify-content: space-between; margin: -12px 0; }
.scroll { overflow-x: auto; }
.pg { align-items: center; display: flex; gap: 6px; }
.pg-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.rl { color: var(--quarry); font-weight: 600; text-decoration: none; }
.rl:hover { text-decoration: underline; }
tr.child td:first-child { background: linear-gradient(90deg, #fafbfc, transparent 60%); }
.caret, .caret-space { flex: none; height: 26px; width: 26px; }
.caret { align-items: center; background: none; border: 0; border-radius: var(--radius); color: var(--text-muted); cursor: pointer; display: inline-flex; justify-content: center; padding: 0; }
.caret:hover { background: var(--mist); color: var(--quarry); }
.caret svg { transition: transform .15s; }
.caret.open svg { transform: rotate(90deg); }
.handle, .handle-space { flex: none; width: 14px; }
.handle { color: var(--text-muted); cursor: grab; font-size: 16px; line-height: 1; user-select: none; }
.handle:active { cursor: grabbing; }
.end { text-align: right; white-space: nowrap; }
.add-child { color: var(--text-muted); font-size: 13px; opacity: 0; }
tr:hover .add-child, .add-child:focus-visible { opacity: 1; }
tr.dragging td { opacity: .45; }
tr.drop-before td { box-shadow: inset 0 3px 0 var(--quarry); }
tr.drop-after td { box-shadow: inset 0 -3px 0 var(--quarry); }
@media (hover: none) { .add-child { opacity: 1; } }
</style>
