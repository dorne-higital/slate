<script setup lang="ts">
definePageMeta({ layout: false, middleware: 'auth' })

interface EditorPageData {
    id: string
    parentId: string | null
    title: string
    path: string
    status: PageStatus
    blocks: Block[]
    seoTitle: string | null
    seoDescription: string | null
    shareImage: string | null
    noIndex: boolean
    hasUnpublishedChanges: boolean
    kind: 'page' | 'project'
    project: ProjectMeta | null
}

const route = useRoute()
const siteId = String(route.params.siteId)
const pageId = String(route.params.pageId)
const fetcher = useRequestFetch()

const [{ data: site }, { data: loaded, error }, { data: allPages, refresh: refreshPages }, { data: menus }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`page-${pageId}`, () => fetcher<EditorPageData>(`/api/sites/${siteId}/pages/${pageId}`)),
    useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`)),
    useAsyncData(`menus-${siteId}`, () => fetcher(`/api/sites/${siteId}/menus`))
])
const { data: forms } = await useAsyncData(`forms-${siteId}`, () => fetcher<FormDefinition[]>(`/api/sites/${siteId}/forms`))
provide('siteForms', computed(() => Object.fromEntries((forms.value ?? []).map(f => [f.id, f]))))
provide('blockPreview', true)
const { data: projectCards } = await useAsyncData(`projects-${siteId}`, () => fetcher<{ title: string, path: string, status: string, project: ProjectMeta }[]>(`/api/sites/${siteId}/projects`))
provide('siteProjects', computed(() => (projectCards.value ?? []).filter(p => p.status === 'published').map(p => ({ title: p.title, path: p.path, category: p.project.category ?? '', summary: p.project.summary ?? '', cover: p.project.cover ?? '', coverAlt: p.project.coverAlt ?? '', year: p.project.year ?? '', featured: !!p.project.featured }))))
provide('siteIntegrations', computed(() => (site.value?.integrations ?? {}) as SiteIntegrations))
const { data: posts } = await useAsyncData(`posts-${siteId}`, () => fetcher<{ title: string, slug: string, excerpt: string, body: string, coverImage: string, publishedAt: string | null, state: string, categoryName: string | null }[]>(`/api/sites/${siteId}/posts`))
provide('sitePosts', computed(() => (posts.value ?? [])
    .filter(p => p.state === 'published')
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .map(p => ({ title: p.title, slug: p.slug, summary: postSummary(p), coverImage: p.coverImage || null, publishedAt: p.publishedAt!, category: p.categoryName ? { name: p.categoryName } : null }))))
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

const page = reactive({
    title: loaded.value!.title,
    seoTitle: loaded.value!.seoTitle ?? '',
    seoDescription: loaded.value!.seoDescription ?? '',
    shareImage: loaded.value!.shareImage ?? '',
    noIndex: loaded.value!.noIndex
})
const blocks = ref<Block[]>(structuredClone(toRaw(loaded.value!.blocks)))
const status = ref<PageStatus>(loaded.value!.status)
const unpublished = ref(loaded.value!.hasUnpublishedChanges)
const selectedId = ref<string | null>(null)
const leftTab = ref<'pages' | 'add'>('add')
const device = ref<'desktop' | 'tablet' | 'phone'>('desktop')

useHead(() => ({
    title: `${page.title} · Editor`,
    link: [{ rel: 'stylesheet', href: themeFontsHref(site.value?.theme as SiteTheme) }]
}))

const selected = computed(() => blocks.value.find(b => b.id === selectedId.value) ?? null)
const linkTargets = computed(() => (allPages.value ?? []).map(p => ({ title: p.title, path: p.path })))
const themeVars = computed(() => siteThemeVars(site.value?.theme as SiteTheme))
const liveUrl = computed(() => {
    if (!site.value) return '#'
    const host = site.value.liveAddress
    return `${host.includes('localhost') ? 'http' : 'https'}://${host}${loaded.value!.path}`
})

// ── Undo ──
const history: string[] = []
function snapshot() {
    history.push(JSON.stringify(blocks.value))
    if (history.length > 50) history.shift()
}
function undo() {
    const prev = history.pop()
    if (prev) {
        blocks.value = JSON.parse(prev)
        if (selectedId.value && !blocks.value.some(b => b.id === selectedId.value)) selectedId.value = null
        queueSave()
    }
}

// ── Saving: every change is saved as a draft a moment after you stop typing ──
type SaveState = 'saved' | 'pending' | 'saving' | 'error'
const saveState = ref<SaveState>('saved')
let timer: ReturnType<typeof setTimeout> | undefined
let typingSnapshotTaken = false

function queueSave() {
    unpublished.value = true
    saveState.value = 'pending'
    clearTimeout(timer)
    timer = setTimeout(save, 700)
}

async function save() {
    clearTimeout(timer)
    saveState.value = 'saving'
    typingSnapshotTaken = false
    try {
        const res = await $fetch<EditorPageData>(`/api/sites/${siteId}/pages/${pageId}`, {
            method: 'PATCH',
            body: { title: page.title, blocks: blocks.value, seoTitle: page.seoTitle || null, seoDescription: page.seoDescription || null, shareImage: page.shareImage || null, noIndex: page.noIndex }
        })
        unpublished.value = res.hasUnpublishedChanges
        saveState.value = saveState.value === 'saving' ? 'saved' : saveState.value
    } catch {
        saveState.value = 'error'
    }
}

function onFieldChange() {
    if (!typingSnapshotTaken) {
        snapshot()
        typingSnapshotTaken = true
    }
    queueSave()
}

const saveText = computed(() => ({
    saved: unpublished.value ? 'Draft saved. Not published yet.' : 'Everything is published.',
    pending: 'Saving…',
    saving: 'Saving…',
    error: 'Couldn’t save. Check your connection; we’ll try again when you next change something.'
})[saveState.value])

// ── Blocks ──
function addBlock(type: string) {
    snapshot()
    const block = newBlock(type)
    const at = selected.value ? blocks.value.indexOf(selected.value) + 1 : blocks.value.length
    blocks.value.splice(at, 0, block)
    selectedId.value = block.id
    queueSave()
}

function move(i: number, dir: -1 | 1) {
    snapshot()
    const [b] = blocks.value.splice(i, 1)
    blocks.value.splice(i + dir, 0, b!)
    queueSave()
}

// ── Block library: grouped, searchable ──
const blockSearch = ref('')
const blockGroups = computed(() => {
    const q = blockSearch.value.trim().toLowerCase()
    return BLOCK_GROUPS
        .map(name => ({ name, blocks: BLOCK_TYPES.filter(b => b.group === name && (!q || b.name.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q))) }))
        .filter(g => g.blocks.length)
})

// ── Drag and drop: move a block by its handle, or drag a new block in from the library ──
const drag = ref<{ from: number } | { type: string } | null>(null)
const dropAt = ref<number | null>(null)
function startMove(e: DragEvent, i: number) {
    drag.value = { from: i }
    e.dataTransfer?.setData('text/plain', blocks.value[i]!.id)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    const frame = (e.target as HTMLElement).closest('.blk-frame')
    if (frame && e.dataTransfer) e.dataTransfer.setDragImage(frame, 24, 24)
}
function startNew(e: DragEvent, type: string) {
    drag.value = { type }
    e.dataTransfer?.setData('text/plain', type)
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
function overBlock(e: DragEvent, i: number) {
    if (!drag.value) return
    e.preventDefault()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    dropAt.value = e.clientY > rect.top + rect.height / 2 ? i + 1 : i
}
function overEmpty(e: DragEvent) {
    if (!drag.value) return
    e.preventDefault()
    dropAt.value = blocks.value.length
}
function endDrag() {
    drag.value = null
    dropAt.value = null
}
function dropBlock() {
    const d = drag.value
    let at = dropAt.value
    endDrag()
    if (!d || at === null) return
    if ('from' in d) {
        if (at === d.from || at === d.from + 1) return
        snapshot()
        const [b] = blocks.value.splice(d.from, 1)
        if (d.from < at) at--
        blocks.value.splice(at, 0, b!)
        selectedId.value = b!.id
    } else {
        snapshot()
        const block = newBlock(d.type)
        blocks.value.splice(at, 0, block)
        selectedId.value = block.id
    }
    queueSave()
}

function duplicate(i: number) {
    snapshot()
    const copy = { ...structuredClone(toRaw(blocks.value[i]!)), id: crypto.randomUUID() }
    blocks.value.splice(i + 1, 0, copy)
    selectedId.value = copy.id
    queueSave()
}

function remove(i: number) {
    snapshot()
    blocks.value.splice(i, 1)
    selectedId.value = null
    queueSave()
}

// ── Publishing ──
const publishing = ref(false)
async function publish() {
    publishing.value = true
    try {
        if (saveState.value !== 'saved') await save()
        const res = await $fetch<EditorPageData>(`/api/sites/${siteId}/pages/${pageId}/publish`, { method: 'POST' })
        status.value = res.status
        unpublished.value = res.hasUnpublishedChanges
        await refreshPages()
    } catch {
        saveState.value = 'error'
    } finally {
        publishing.value = false
    }
}

// ── New page ──
const newTitle = ref('')
const newUnder = ref<string>('')
const creating = ref(false)
async function createPage() {
    if (!newTitle.value.trim()) return
    creating.value = true
    try {
        if (saveState.value !== 'saved') await save()
        const created = await $fetch<EditorPageData>(`/api/sites/${siteId}/pages`, { method: 'POST', body: { title: newTitle.value, parentId: newUnder.value || null } })
        await navigateTo(`/sites/${siteId}/pages/${created.id}`)
    } finally {
        creating.value = false
    }
}

function onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey && !typing) {
        e.preventDefault()
        undo()
    }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey)
    if (saveState.value === 'pending') save()
})
onBeforeRouteLeave(async () => {
    if (saveState.value === 'pending') await save()
})
</script>

<template>
    <div class="ed">
        <header class="top">
            <NuxtLink class="ib" :to="loaded?.kind === 'project' ? `/sites/${siteId}/projects` : `/sites/${siteId}/pages`" :aria-label="loaded?.kind === 'project' ? 'Back to projects' : 'Back to pages'">
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M12 4l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
            </NuxtLink>
            <div class="title">
                <b>{{ page.title }}</b>
                <span :class="{ err: saveState === 'error' }" aria-live="polite">{{ saveText }}</span>
            </div>
            <div class="seg" role="group" aria-label="Preview size">
                <button v-for="d in (['desktop', 'tablet', 'phone'] as const)" :key="d" type="button" :class="{ on: device === d }" :aria-pressed="device === d" @click="device = d">
                    {{ d[0]!.toUpperCase() + d.slice(1) }}
                </button>
            </div>
            <div class="top-actions">
                <button class="ib" type="button" aria-label="Undo" title="Undo (Ctrl/Cmd Z)" @click="undo">
                    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5L3 9l4 4M3 9h9a5 5 0 0 1 0 10h-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <a v-if="status === 'published'" class="btn btn-ghost" :href="liveUrl" target="_blank" rel="noopener">View live</a>
                <button class="btn btn-dark" type="button" :disabled="publishing || !unpublished" @click="publish">
                    {{ publishing ? 'Publishing…' : unpublished ? 'Publish' : 'Published' }}
                </button>
            </div>
        </header>

        <div class="body">
            <aside class="left">
                <div class="tabs" role="tablist" aria-label="Left panel">
                    <button type="button" role="tab" :aria-selected="leftTab === 'pages'" :class="{ on: leftTab === 'pages' }" @click="leftTab = 'pages'">Pages</button>
                    <button type="button" role="tab" :aria-selected="leftTab === 'add'" :class="{ on: leftTab === 'add' }" @click="leftTab = 'add'">Add a block</button>
                </div>

                <div v-if="leftTab === 'pages'" class="panel-body">
                    <nav class="tree" aria-label="Pages">
                        <NuxtLink
                            v-for="p in allPages"
                            :key="p.id"
                            :to="`/sites/${siteId}/pages/${p.id}`"
                            :class="{ on: p.id === pageId }"
                            :style="{ paddingLeft: `${12 + (p.path === '/' ? 0 : p.path.split('/').length - 2) * 16}px` }"
                            :aria-current="p.id === pageId ? 'page' : undefined"
                        >
                            {{ p.title }} <small v-if="p.status === 'draft'">Draft</small>
                        </NuxtLink>
                    </nav>
                    <form class="new" @submit.prevent="createPage">
                        <b>New page</b>
                        <div class="field"><label for="np-title">Title</label><input id="np-title" v-model="newTitle" class="inp" type="text" required></div>
                        <div class="field">
                            <label for="np-under">Put it under</label>
                            <select id="np-under" v-model="newUnder" class="inp">
                                <option value="">Nothing (top level)</option>
                                <option v-for="p in allPages?.filter(p => p.path !== '/')" :key="p.id" :value="p.id">{{ p.title }}</option>
                            </select>
                        </div>
                        <button class="btn btn-ghost" type="submit" :disabled="creating">{{ creating ? 'Adding…' : 'Add page' }}</button>
                    </form>
                </div>

                <div v-else class="panel-body">
                    <label class="visually-hidden" for="blk-search">Find a block</label>
                    <input id="blk-search" v-model="blockSearch" class="inp blk-search" type="search" placeholder="Find a block">
                    <p class="muted hint">Click to add {{ selected ? 'under the selected block' : 'to the end' }}, or drag onto the page.</p>
                    <details v-for="(g, gi) in blockGroups" :key="g.name" class="grp" :open="!!blockSearch.trim() || gi === 0 || undefined">
                        <summary><span>{{ g.name }}</span><span class="grp-n">{{ g.blocks.length }}</span></summary>
                        <div class="grp-items">
                            <div v-for="b in g.blocks" :key="b.type" class="lib-row">
                                <button class="lib" type="button" draggable="true" :aria-description="b.desc" @click="addBlock(b.type)" @dragstart="startNew($event, b.type)" @dragend="endDrag">{{ b.name }}</button>
                                <span class="info" tabindex="0" :aria-label="`About ${b.name}: ${b.desc}`" :data-tip="b.desc">i</span>
                            </div>
                        </div>
                    </details>
                    <p v-if="!blockGroups.length" class="muted hint">No blocks match.</p>
                </div>
            </aside>

            <main class="canvas-wrap" aria-label="Page canvas" @click.self="selectedId = null">
                <div class="canvas" :class="device" :style="themeVars">
                    <div class="shared">
                        <SiteHeader :name="site?.name ?? ''" :items="menus?.header ?? []" :theme="(site?.theme as SiteTheme)" :socials="(site?.socials as SiteSocials)" preview :compact="device === 'phone'" />
                        <NuxtLink class="tag" :to="`/sites/${siteId}/menus`">Header, shared on every page. Edit in Menus</NuxtLink>
                    </div>
                    <div v-if="loaded?.kind === 'project' && loaded.project" class="shared">
                        <ProjectHeader :title="page.title" :project="loaded.project" />
                        <NuxtLink class="tag" :to="`/sites/${siteId}/projects`">Project details. Edit in Projects</NuxtLink>
                    </div>

                    <div
                        v-for="(b, i) in blocks"
                        :key="b.id"
                        class="blk-frame"
                        :class="{ 'sel': b.id === selectedId, 'drop-before': dropAt === i, 'drop-after': dropAt === blocks.length && i === blocks.length - 1, 'is-dragging': drag && 'from' in drag && drag.from === i }"
                        @dragover="overBlock($event, i)"
                        @drop.prevent="dropBlock"
                    >
                        <button class="blk-hit" type="button" :aria-label="`Select ${findBlockType(b.type)?.name ?? b.type} block`" @click="selectedId = b.id" />
                        <div v-if="b.id === selectedId" class="blk-bar" role="toolbar" :aria-label="`${findBlockType(b.type)?.name} block tools`">
                            <span class="drag-handle" draggable="true" title="Drag to move" @dragstart="startMove($event, i)" @dragend="endDrag">
                                <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.4" /><circle cx="9" cy="3" r="1.4" /><circle cx="3" cy="8" r="1.4" /><circle cx="9" cy="8" r="1.4" /><circle cx="3" cy="13" r="1.4" /><circle cx="9" cy="13" r="1.4" /></g></svg>
                                {{ findBlockType(b.type)?.name }}
                            </span>
                            <button class="ib" type="button" aria-label="Move up" :disabled="i === 0" @click="move(i, -1)">
                                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </button>
                            <button class="ib" type="button" aria-label="Move down" :disabled="i === blocks.length - 1" @click="move(i, 1)">
                                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </button>
                            <button class="ib" type="button" aria-label="Duplicate" @click="duplicate(i)">
                                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 5h8v8H5zM3 11V3h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>
                            </button>
                            <button class="ib" type="button" aria-label="Delete" @click="remove(i)">
                                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.7 9.5h5.6l.7-9.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                            </button>
                        </div>
                        <BlockView :block="b" />
                    </div>

                    <div v-if="!blocks.length" class="empty" :class="{ 'drop-here': dropAt === 0 }" @dragover="overEmpty" @drop.prevent="dropBlock">
                        <b>This page has no blocks yet</b>
                        <span>Pick one from Add a block on the left.</span>
                    </div>

                    <div class="shared foot">
                        <SiteFooter :name="site?.name ?? ''" :items="menus?.footer ?? []" :legal="menus?.legal ?? []" :theme="(site?.theme as SiteTheme)" :socials="(site?.socials as SiteSocials)" preview />
                        <NuxtLink class="tag" :to="`/sites/${siteId}/menus`">Footer, shared on every page. Edit in Menus</NuxtLink>
                    </div>
                </div>
            </main>

            <aside class="right" aria-label="Block settings">
                <BlockInspector v-if="selected" :key="selected.id" :block="selected" :pages="linkTargets" :forms="forms ?? []" :site-id="siteId" @change="onFieldChange" />
                <div v-else class="page-settings">
                    <div class="insp-head">
                        <b>Page settings</b>
                        <span class="muted">Select a block on the page to change it.</span>
                    </div>
                    <div class="field"><label for="ps-title">Page title</label><input id="ps-title" v-model="page.title" class="inp" type="text" @input="queueSave"></div>
                    <div class="field">
                        <span class="lbl">Address</span>
                        <span class="addr">{{ loaded?.path }}</span>
                    </div>
                    <div class="field">
                        <label for="ps-seo-title">Title in search results</label>
                        <input id="ps-seo-title" v-model="page.seoTitle" class="inp" type="text" :placeholder="page.title" @input="queueSave">
                    </div>
                    <div class="field">
                        <label for="ps-seo-desc">Description in search results</label>
                        <textarea id="ps-seo-desc" v-model="page.seoDescription" class="inp" rows="4" @input="queueSave" />
                        <span class="help">One or two sentences. {{ page.seoDescription.length }}/160</span>
                    </div>
                    <div class="field">
                        <label for="ps-share">Share image</label>
                        <input id="ps-share" v-model="page.shareImage" class="inp" type="text" placeholder="https://…" @input="queueSave">
                        <span class="help">Shown when someone posts a link to this page.</span>
                    </div>
                    <label class="check"><input v-model="page.noIndex" type="checkbox" @change="queueSave">Hide this page from search engines</label>
                    <NuxtLink class="help" :to="`/sites/${siteId}/seo`">See search details for every page</NuxtLink>
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.ed { display: flex; flex-direction: column; height: 100vh; }

.top { align-items: center; background: var(--white); border-bottom: 1px solid var(--line); display: flex; flex: none; gap: 16px; padding: 10px 16px; }
.title { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.title b { font-size: 16px; }
.title span { color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.title span.err { color: var(--danger); }
.top-actions { align-items: center; display: flex; gap: 10px; }

.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; height: 36px; justify-content: center; width: 36px; }
.ib:hover:not(:disabled) { background: var(--mist); }
.ib:disabled { cursor: default; opacity: .35; }

.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 32px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }

.body { display: grid; flex: 1; grid-template-columns: 260px minmax(0, 1fr) 320px; min-height: 0; }

.left, .right { background: var(--white); overflow-y: auto; }
.left { border-right: 1px solid var(--line); }
.right { border-left: 1px solid var(--line); padding: 20px; }

.tabs { border-bottom: 1px solid var(--line-soft); display: flex; }
.tabs button { background: none; border: 0; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; flex: 1; font-family: inherit; font-size: 14px; font-weight: 700; height: 46px; }
.tabs button.on { border-bottom-color: var(--quarry); color: var(--quarry); }
.panel-body { display: flex; flex-direction: column; gap: 8px; padding: 14px; }
.hint { margin: 0 0 6px; }

.blk-search { font-size: 14px; height: 38px; }
.grp { border-bottom: 1px solid var(--line-soft); }
.grp summary { align-items: center; cursor: pointer; display: flex; font-size: 13px; font-weight: 700; gap: 8px; justify-content: space-between; list-style: none; padding: 9px 2px; text-transform: none; }
.grp summary::-webkit-details-marker { display: none; }
.grp summary::before { border: solid var(--text-muted); border-width: 0 2px 2px 0; content: ''; height: 6px; margin-right: 4px; transform: rotate(-45deg); transition: transform .15s; width: 6px; }
.grp[open] summary::before { transform: rotate(45deg); }
.grp summary span:first-of-type { flex: 1; }
.grp-n { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 11px; padding: 1px 7px; }
.grp-items { display: flex; flex-direction: column; gap: 6px; padding: 0 0 10px; }
.lib-row { align-items: center; display: flex; gap: 6px; position: relative; }
.lib { background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius); color: var(--quarry); cursor: grab; flex: 1; font-family: inherit; font-size: 14px; font-weight: 600; padding: 8px 12px; text-align: left; }
.lib:hover { border-color: var(--quarry); }
.info { align-items: center; border: 1.5px solid var(--line); border-radius: 50%; color: var(--text-muted); cursor: help; display: inline-flex; flex: none; font-family: Georgia, serif; font-size: 12px; font-style: italic; font-weight: 700; height: 22px; justify-content: center; width: 22px; }
.info:hover, .info:focus-visible { border-color: var(--quarry); color: var(--quarry); outline: none; }
.info::after { background: var(--quarry); border-radius: var(--radius); bottom: calc(100% + 6px); color: var(--white); content: attr(data-tip); font-family: inherit; font-size: 13px; font-style: normal; font-weight: 500; left: 0; line-height: 1.4; opacity: 0; padding: 8px 10px; pointer-events: none; position: absolute; right: 0; transition: opacity .12s; z-index: 10; }
.info:hover::after, .info:focus-visible::after { opacity: 1; }

.tree { display: flex; flex-direction: column; gap: 2px; }
.tree a { border-radius: var(--radius); color: var(--quarry); font-size: 15px; padding: 8px 12px; text-decoration: none; }
.tree a:hover { background: var(--mist); }
.tree a.on { background: var(--quarry); color: var(--white); }
.tree small { color: inherit; font-size: 12px; opacity: .7; }
.new { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 12px; margin-top: 12px; padding-top: 14px; }
.new .inp { font-size: 15px; height: 42px; }
.new label { font-size: 14px; }

.canvas-wrap { background: #dfe2e8; overflow-y: auto; padding: 28px; }
.canvas { background: var(--site-bg); box-shadow: 0 0 0 1px var(--line); margin: 0 auto; max-width: 1200px; transition: max-width .2s; }
.canvas.tablet { max-width: 820px; }
.canvas.phone { max-width: 390px; }

.shared { position: relative; }
.shared .tag { background: var(--mist); border-radius: 999px; bottom: 6px; color: var(--text-muted); font-size: 12px; font-weight: 600; opacity: 0; padding: 3px 9px; position: absolute; right: 8px; text-decoration: none; transition: opacity .15s; }
.shared:hover .tag, .shared .tag:focus-visible { opacity: 1; }
.canvas { color: var(--site-text); font-family: var(--site-body-font); }

.blk-frame { position: relative; }
.blk-frame .blk-hit { background: transparent; border: 0; cursor: pointer; inset: 0; position: absolute; z-index: 2; }
.blk-frame:hover::after, .blk-frame.sel::after { content: ''; inset: 0; pointer-events: none; position: absolute; z-index: 3; }
.blk-frame:hover::after { box-shadow: inset 0 0 0 2px var(--split); }
.blk-frame.sel::after { box-shadow: inset 0 0 0 3px var(--lichen); }
.blk-frame .blk-hit:focus-visible { outline: 3px solid var(--lichen); outline-offset: -3px; }

.blk-bar { align-items: center; background: var(--quarry); border-radius: var(--radius); color: var(--white); display: flex; gap: 2px; left: 12px; padding: 3px 3px 3px 12px; position: absolute; top: 12px; z-index: 4; }
.blk-bar > span { font-size: 13px; font-weight: 700; margin-right: 8px; }
.blk-bar .ib { color: var(--white); height: 30px; width: 30px; }
.blk-bar .ib:hover:not(:disabled) { background: var(--heather); }

.empty { align-items: center; color: var(--site-muted); display: flex; flex-direction: column; gap: 6px; padding: 96px 24px; text-align: center; }
.empty b { color: var(--site-text); font-size: 18px; }

.page-settings, .insp-head { display: flex; flex-direction: column; gap: 18px; }
.insp-head { gap: 2px; }
.insp-head b { font-size: 17px; }
.page-settings .inp { font-size: 15px; height: 42px; }
.page-settings textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.page-settings label, .lbl { font-size: 14px; font-weight: 600; }
.check { align-items: center; display: flex; font-size: 14px; gap: 10px; }
.check input { accent-color: var(--quarry); height: 18px; width: 18px; }
.addr { color: var(--text-body); font-family: ui-monospace, monospace; font-size: 14px; }

@media (max-width: 1100px) {
    .body { grid-template-columns: 220px minmax(0, 1fr) 280px; }
    .seg { display: none; }
}

@media (max-width: 800px) {
    .ed { height: auto; }
    .body { grid-template-columns: minmax(0, 1fr); }
    .left, .right { border: 0; border-top: 1px solid var(--line); }
    .canvas-wrap { padding: 12px; }
}
.drag-handle { align-items: center; cursor: grab; display: inline-flex; gap: 8px; user-select: none; }
.drag-handle:active { cursor: grabbing; }
.blk-frame.is-dragging { opacity: .4; }
.blk-frame.drop-before::before, .blk-frame.drop-after::before { background: var(--lichen, #E8A33A); content: ''; height: 4px; left: 0; position: absolute; right: 0; z-index: 5; }
.blk-frame.drop-before::before { top: -2px; }
.blk-frame.drop-after::before { bottom: -2px; }
.lib[draggable="true"] { cursor: grab; }
.empty.drop-here { outline: 3px dashed var(--lichen, #E8A33A); }
</style>
