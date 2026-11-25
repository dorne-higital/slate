<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const { me } = useMe()

const { data: items } = await useAsyncData(`media-${siteId}`, () => useRequestFetch()<MediaItem[]>(`/api/sites/${siteId}/media`), { default: () => [] })
useHead({ title: 'Media · Slate' })

const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)
const { upload, uploading, error } = useMediaUpload(siteId)
const search = ref('')
const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find(m => m.id === selectedId.value) ?? null)
const shown = computed(() => items.value.filter(m => !search.value.trim() || m.filename.toLowerCase().includes(search.value.trim().toLowerCase())))
const totalSize = computed(() => items.value.reduce((n, m) => n + m.size, 0))

const dragging = ref(false)
async function addFiles(files: FileList | File[] | null | undefined) {
    if (!files?.length) return
    const added = await upload(files)
    items.value = [...added, ...items.value]
    if (added.length === 1) selectedId.value = added[0]!.id
}
function onDrop(e: DragEvent) {
    dragging.value = false
    if (canEdit.value) addFiles(e.dataTransfer?.files)
}
function onPick(e: Event) {
    const input = e.target as HTMLInputElement
    addFiles(input.files)
    input.value = ''
}

const altDraft = ref('')
watch(selected, m => (altDraft.value = m?.alt ?? ''), { immediate: true })
const saved = ref(false)
async function saveAlt() {
    if (!selected.value) return
    const updated = await $fetch<MediaItem>(`/api/sites/${siteId}/media/${selected.value.id}`, { method: 'PATCH', body: { alt: altDraft.value } })
    items.value = items.value.map(m => m.id === updated.id ? updated : m)
    saved.value = true
    setTimeout(() => (saved.value = false), 1500)
}

const confirmDelete = ref(false)
watch(selectedId, () => (confirmDelete.value = false))
async function remove() {
    if (!selected.value) return
    const id = selected.value.id
    await $fetch(`/api/sites/${siteId}/media/${id}`, { method: 'DELETE' })
    items.value = items.value.filter(m => m.id !== id)
    selectedId.value = null
}

const copied = ref(false)
async function copyAddress() {
    if (!selected.value) return
    try {
        await navigator.clipboard.writeText(new URL(selected.value.url, location.origin).href)
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
    } catch {
        // Clipboard blocked: the address is shown to copy by hand
    }
}
const isImage = (m: MediaItem) => m.contentType.startsWith('image/')
</script>

<template>
    <div class="page" @dragover.prevent="dragging = canEdit" @dragleave.self="dragging = false" @drop.prevent="onDrop">
        <div class="head">
            <div>
                <h1>Media</h1>
                <p class="muted sub">{{ items.length }} {{ items.length === 1 ? 'file' : 'files' }} · {{ formatBytes(totalSize) }}</p>
            </div>
            <label v-if="canEdit" class="btn btn-dark">
                {{ uploading ? `Uploading ${uploading}…` : 'Upload files' }}
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,application/pdf" class="visually-hidden" @change="onPick">
            </label>
        </div>

        <p v-if="error" class="error-box" role="alert">{{ error }}</p>

        <label class="search">
            <span class="visually-hidden">Search files</span>
            <input v-model="search" class="inp" type="search" placeholder="Search by file name">
        </label>

        <div class="two">
            <section class="panel lib" :class="{ drag: dragging }" aria-label="Files">
                <div v-if="!items.length" class="empty">
                    <b>Drop images here, or press Upload files</b>
                    <span class="muted">JPG, PNG, WebP, GIF, AVIF or PDF, up to 10 MB each.</span>
                </div>
                <p v-else-if="!shown.length" class="muted pad">No files match.</p>
                <ul v-else class="grid">
                    <li v-for="m in shown" :key="m.id">
                        <button type="button" class="tile" :class="{ on: m.id === selectedId }" :aria-pressed="m.id === selectedId" @click="selectedId = m.id">
                            <img v-if="isImage(m)" :src="m.url" :alt="m.alt || ''" loading="lazy">
                            <span v-else class="doc" aria-hidden="true">PDF</span>
                            <span class="tile-name">{{ m.filename }}</span>
                        </button>
                    </li>
                </ul>
                <div v-if="dragging" class="drop-hint" aria-hidden="true">Drop to upload</div>
            </section>

            <aside class="panel side" aria-label="File details">
                <template v-if="selected">
                    <img v-if="isImage(selected)" :src="selected.url" :alt="selected.alt || ''" class="preview">
                    <a v-else :href="selected.url" target="_blank" rel="noopener" class="btn btn-ghost">Open PDF</a>
                    <b class="fname">{{ selected.filename }}</b>
                    <span class="muted small">
                        {{ formatBytes(selected.size) }}<template v-if="selected.width"> · {{ selected.width }} × {{ selected.height }}</template>
                        · {{ new Date(selected.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                    </span>
                    <form v-if="isImage(selected)" class="field" @submit.prevent="saveAlt">
                        <label for="alt">Describe the image</label>
                        <textarea id="alt" v-model="altDraft" class="inp" rows="2" maxlength="300" :disabled="!canEdit" placeholder="e.g. Oak dining table in a sunny kitchen" />
                        <span class="help">Read out by screen readers. Used when you pick this image.</span>
                        <div v-if="canEdit" class="row">
                            <button class="btn btn-ghost btn-sm" type="submit">Save description</button>
                            <span v-if="saved" class="muted small" role="status">Saved.</span>
                        </div>
                    </form>
                    <div class="row">
                        <button class="btn btn-ghost btn-sm" type="button" @click="copyAddress">{{ copied ? 'Copied' : 'Copy address' }}</button>
                        <template v-if="canEdit">
                            <button v-if="!confirmDelete" class="btn btn-plain btn-sm danger" type="button" @click="confirmDelete = true">Delete</button>
                            <span v-else class="confirm">Pages using it will show a gap.
                                <button class="btn btn-sm del" type="button" @click="remove">Delete file</button>
                                <button class="btn btn-plain btn-sm" type="button" @click="confirmDelete = false">Keep</button>
                            </span>
                        </template>
                    </div>
                </template>
                <p v-else class="muted">Choose a file to see its details.</p>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
.head { align-items: flex-start; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.head label { cursor: pointer; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.sub { margin: 4px 0 0; }
.search { max-width: 360px; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) 320px; }
.lib { min-height: 320px; padding: 16px; position: relative; }
.lib.drag { box-shadow: 0 0 0 3px var(--quarry); }
.drop-hint { align-items: center; background: rgb(255 255 255 / 85%); border-radius: inherit; display: flex; font-size: 18px; font-weight: 700; inset: 0; justify-content: center; position: absolute; }
.empty { align-items: center; border: 2px dashed var(--input-border); border-radius: var(--radius-lg); display: flex; flex-direction: column; gap: 6px; justify-content: center; min-height: 280px; padding: 24px; text-align: center; }
.pad { padding: 8px; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); list-style: none; margin: 0; padding: 0; }
.tile { background: none; border: 0; border-radius: var(--radius); cursor: pointer; display: flex; flex-direction: column; gap: 6px; padding: 4px; text-align: left; width: 100%; }
.tile img, .doc { aspect-ratio: 1; background: var(--mist); border-radius: var(--radius); object-fit: cover; width: 100%; }
.doc { align-items: center; color: var(--text-muted); display: flex; font-weight: 800; justify-content: center; }
.tile-name { font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tile.on { outline: 3px solid var(--quarry); }
.side { display: flex; flex-direction: column; gap: 12px; padding: 20px; position: sticky; top: 16px; }
.preview { background: var(--mist); border-radius: var(--radius); max-height: 260px; object-fit: contain; width: 100%; }
.fname { overflow-wrap: anywhere; }
.small { font-size: 13px; }
.field label { font-size: 14px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.danger { color: var(--danger); }
.confirm { align-items: center; color: var(--danger); display: flex; flex-wrap: wrap; font-size: 13px; gap: 6px; }
.del { background: var(--danger); color: var(--white); }
@media (max-width: 1000px) { .two { grid-template-columns: minmax(0, 1fr); } .side { position: static; } }
</style>
