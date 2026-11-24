<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()
useHead({ title: 'Projects · Slate' })

interface ProjectRow { id: string, title: string, slug: string, path: string, status: PageStatus, hasUnpublishedChanges: boolean, project: Required<ProjectMeta>, updatedAt: string }

const [{ data: projects, refresh }, { data: site }] = await Promise.all([
    useAsyncData(`projects-${siteId}`, () => fetcher<ProjectRow[]>(`/api/sites/${siteId}/projects`)),
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
])
const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)

// ── New ──
const newTitle = ref('')
const creating = ref(false)
const error = ref('')
async function create() {
    if (!newTitle.value.trim()) return
    creating.value = true
    error.value = ''
    try {
        const p = await $fetch<ProjectRow>(`/api/sites/${siteId}/projects`, { method: 'POST', body: { title: newTitle.value } })
        newTitle.value = ''
        await refresh()
        select(p.id)
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t add the project. Please try again.'
    } finally {
        creating.value = false
    }
}

// ── Order ──
async function move(i: number, d: number) {
    const list = [...(projects.value ?? [])]
    const [p] = list.splice(i, 1)
    list.splice(i + d, 0, p!)
    projects.value = list
    await $fetch(`/api/sites/${siteId}/projects/order`, { method: 'POST', body: { ids: list.map(x => x.id) } })
}

// ── Details form ──
const selectedId = ref<string | null>(projects.value?.[0]?.id ?? null)
const form = ref<{ title: string, slug: string, project: Required<ProjectMeta> } | null>(null)
function select(id: string) {
    selectedId.value = id
    const p = projects.value?.find(x => x.id === id)
    form.value = p ? { title: p.title, slug: p.slug, project: structuredClone(toRaw(p.project)) } : null
    saved.value = false
    confirmDelete.value = false
}
const selected = computed(() => projects.value?.find(p => p.id === selectedId.value) ?? null)
const categories = computed(() => [...new Set((projects.value ?? []).map(p => p.project.category).filter(Boolean))])

const saving = ref(false)
const saved = ref(false)
async function save() {
    if (!form.value || !selected.value) return
    saving.value = true
    error.value = ''
    try {
        await $fetch(`/api/sites/${siteId}/projects/${selected.value.id}`, { method: 'PATCH', body: form.value })
        await refresh()
        select(selected.value.id)
        saved.value = true
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save. Please try again.'
    } finally {
        saving.value = false
    }
}
const confirmDelete = ref(false)
if (selectedId.value) select(selectedId.value)
async function remove() {
    if (!selected.value) return
    await $fetch(`/api/sites/${siteId}/projects/${selected.value.id}`, { method: 'DELETE' })
    await refresh()
    const first = projects.value?.[0]
    if (first) select(first.id)
    else { selectedId.value = null; form.value = null }
}
const addRow = (key: 'details' | 'links') => {
    if (!form.value) return
    if (key === 'details') form.value.project.details.push({ label: '', value: '' })
    else form.value.project.links.push({ label: '', url: '' })
}
const status = (p: ProjectRow) => p.status === 'draft' ? 'Draft' : p.hasUnpublishedChanges ? 'Changes not published' : 'Published'
</script>

<template>
    <div class="page">
        <div class="head">
            <div>
                <h1>Projects</h1>
                <p class="muted">Your portfolio. Each project gets its own page at {{ site?.liveAddress }}/work/…, and a Projects block shows them as cards.</p>
            </div>
            <form v-if="canEdit" class="new" @submit.prevent="create">
                <label class="visually-hidden" for="np">New project name</label>
                <input id="np" v-model="newTitle" class="inp" type="text" placeholder="Project name" maxlength="120">
                <button class="btn btn-dark" type="submit" :disabled="creating || !newTitle.trim()">{{ creating ? 'Adding…' : 'Add project' }}</button>
            </form>
        </div>
        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <div class="two">
            <section class="panel" aria-label="Projects">
                <ul class="list">
                    <li v-for="(p, i) in projects" :key="p.id" :class="{ on: p.id === selectedId }">
                        <button type="button" class="pick" @click="select(p.id)">
                            <img v-if="p.project.cover" :src="p.project.cover" alt="" class="thumb">
                            <span v-else class="thumb" aria-hidden="true" />
                            <span class="txt">
                                <b>{{ p.title }}</b>
                                <span class="muted small">{{ [p.project.category, status(p)].filter(Boolean).join(' · ') }}</span>
                            </span>
                        </button>
                        <span v-if="canEdit" class="tools">
                            <button class="ib" type="button" :aria-label="`Move ${p.title} up`" :disabled="i === 0" @click="move(i, -1)">↑</button>
                            <button class="ib" type="button" :aria-label="`Move ${p.title} down`" :disabled="i === (projects?.length ?? 0) - 1" @click="move(i, 1)">↓</button>
                        </span>
                    </li>
                    <li v-if="!projects?.length" class="empty muted">No projects yet. Type a name above and press Add project.</li>
                </ul>
            </section>

            <section v-if="form && selected" class="panel box" aria-labelledby="pd-h">
                <div class="row-between">
                    <h2 id="pd-h">Project details</h2>
                    <NuxtLink class="btn btn-dark btn-sm" :to="`/sites/${siteId}/pages/${selected.id}`">Edit the page</NuxtLink>
                </div>
                <p class="muted small">These show at the top of the project’s page and on its card. Write the rest of the story in the page editor, then publish it there.</p>
                <form class="fields" @submit.prevent="save">
                    <div class="field"><label for="p-title">Name</label><input id="p-title" v-model="form.title" class="inp" maxlength="120" :disabled="!canEdit"></div>
                    <div class="field">
                        <label for="p-slug">Address</label>
                        <span class="addr"><span class="muted">/work/</span><input id="p-slug" v-model="form.slug" class="inp" maxlength="80" :disabled="!canEdit"></span>
                    </div>
                    <div class="pair">
                        <div class="field">
                            <label for="p-cat">Category</label>
                            <input id="p-cat" v-model="form.project.category" class="inp" maxlength="40" list="p-cats" placeholder="e.g. New build" :disabled="!canEdit">
                            <datalist id="p-cats"><option v-for="c in categories" :key="c" :value="c" /></datalist>
                            <span class="help">Used for the filter buttons.</span>
                        </div>
                        <div class="field"><label for="p-year">Year</label><input id="p-year" v-model="form.project.year" class="inp" maxlength="20" :disabled="!canEdit"></div>
                    </div>
                    <div class="field"><label for="p-sum">Short description</label><textarea id="p-sum" v-model="form.project.summary" class="inp" rows="3" maxlength="400" :disabled="!canEdit" /></div>
                    <div class="field">
                        <span class="lb">Cover picture</span>
                        <span class="img-row">
                            <img v-if="form.project.cover" :src="form.project.cover" alt="" class="cover">
                            <MediaPicker v-if="canEdit" :site-id="siteId" @pick="(m: MediaItem) => { form!.project.cover = m.url; if (!form!.project.coverAlt) form!.project.coverAlt = m.alt ?? '' }" />
                            <button v-if="form.project.cover && canEdit" class="btn btn-plain btn-sm" type="button" @click="form.project.cover = ''">Remove</button>
                        </span>
                    </div>
                    <div class="field"><label for="p-alt">Describe the cover</label><input id="p-alt" v-model="form.project.coverAlt" class="inp" maxlength="200" :disabled="!canEdit"><span class="help">For people using screen readers.</span></div>
                    <label class="check"><input v-model="form.project.featured" type="checkbox" :disabled="!canEdit"> Featured (for Projects blocks set to show featured ones)</label>

                    <fieldset class="group">
                        <legend>Details</legend>
                        <span class="help">Shown beside the cover, e.g. Built: 2025, Platform: iPhone, Pages: 6.</span>
                        <div v-for="(d, i) in form.project.details" :key="i" class="pair three">
                            <input v-model="d.label" class="inp" placeholder="Label" maxlength="60" :aria-label="`Detail ${i + 1} label`" :disabled="!canEdit">
                            <input v-model="d.value" class="inp" placeholder="Value" maxlength="300" :aria-label="`Detail ${i + 1} value`" :disabled="!canEdit">
                            <button v-if="canEdit" class="ib" type="button" :aria-label="`Remove detail ${i + 1}`" @click="form.project.details.splice(i, 1)">✕</button>
                        </div>
                        <button v-if="canEdit && form.project.details.length < 10" class="btn btn-ghost btn-sm self-start" type="button" @click="addRow('details')">Add a detail</button>
                    </fieldset>

                    <fieldset class="group">
                        <legend>Buttons</legend>
                        <span class="help">e.g. Visit live site, App Store. Up to 4.</span>
                        <div v-for="(l, i) in form.project.links" :key="i" class="pair three">
                            <input v-model="l.label" class="inp" placeholder="Button text" maxlength="60" :aria-label="`Button ${i + 1} text`" :disabled="!canEdit">
                            <input v-model="l.url" class="inp" placeholder="https://…" maxlength="300" :aria-label="`Button ${i + 1} address`" :disabled="!canEdit">
                            <button v-if="canEdit" class="ib" type="button" :aria-label="`Remove button ${i + 1}`" @click="form.project.links.splice(i, 1)">✕</button>
                        </div>
                        <button v-if="canEdit && form.project.links.length < 4" class="btn btn-ghost btn-sm self-start" type="button" @click="addRow('links')">Add a button</button>
                    </fieldset>

                    <div v-if="canEdit" class="row-between">
                        <span class="row">
                            <button class="btn btn-dark" type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save details' }}</button>
                            <span v-if="saved" class="muted small" role="status">Saved. Changes show straight away on the live page.</span>
                        </span>
                        <span v-if="!confirmDelete"><button class="btn btn-plain btn-sm del-link" type="button" @click="confirmDelete = true">Delete project…</button></span>
                    </div>
                    <div v-if="confirmDelete" class="confirm" role="alert">
                        <span>Delete <b>{{ selected.title }}</b> and its page? This can’t be undone.</span>
                        <span class="row">
                            <button class="btn del" type="button" @click="remove">Delete project</button>
                            <button class="btn btn-plain btn-sm" type="button" @click="confirmDelete = false">Keep it</button>
                        </span>
                    </div>
                </form>
            </section>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.head p { margin: 6px 0 0; max-width: 60ch; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.new { display: flex; flex-wrap: wrap; gap: 8px; }
.new .inp { font-size: 15px; height: 42px; width: 240px; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); }
.list { list-style: none; margin: 0; padding: 6px; }
.list li { align-items: center; border-radius: var(--radius); display: flex; gap: 4px; }
.list li.on { background: var(--mist); }
.pick { align-items: center; background: none; border: 0; color: var(--quarry); cursor: pointer; display: flex; flex: 1; font: inherit; gap: 12px; min-width: 0; padding: 10px; text-align: left; }
.txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.txt b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.thumb { background: #dce4df; border-radius: 4px; flex: none; height: 44px; object-fit: cover; width: 64px; }
.tools { display: flex; padding-right: 6px; }
.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; height: 32px; justify-content: center; width: 32px; }
.ib:hover:not(:disabled) { background: var(--white); }
.ib:disabled { cursor: default; opacity: .35; }
.empty { padding: 16px; }
.small { font-size: 13px; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.row-between { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.fields { display: flex; flex-direction: column; gap: 16px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; }
.addr { align-items: center; display: flex; gap: 4px; }
.addr .inp { flex: 1; }
.pair { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.pair.three { align-items: center; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto; }
.lb { font-size: 14px; font-weight: 600; }
.img-row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.cover { border-radius: 4px; height: 64px; object-fit: cover; width: 96px; }
.check { align-items: center; display: flex; font-size: 14px; gap: 8px; }
.group { border: 0; border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 14px 0 0; }
.group legend { font-size: 15px; font-weight: 700; padding: 0; }
.self-start { align-self: flex-start; }
.del-link { color: var(--danger); }
.confirm { align-items: center; background: #fbeceb; border-radius: var(--radius); display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; padding: 12px 14px; }
.del { background: var(--danger); color: var(--white); }
@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
