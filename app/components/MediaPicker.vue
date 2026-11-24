<script setup lang="ts">
// "Choose image" for any image field: pick from the library or upload a new one.
const props = defineProps<{ siteId: string }>()
const emit = defineEmits<{ pick: [item: MediaItem] }>()

const open = ref(false)
const items = ref<MediaItem[]>([])
const loading = ref(false)
const { upload, uploading, error } = useMediaUpload(props.siteId)

async function show() {
    open.value = true
    loading.value = true
    try {
        items.value = await $fetch<MediaItem[]>(`/api/sites/${props.siteId}/media`, { query: { images: '1' } })
    } finally {
        loading.value = false
    }
}

async function onFiles(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    const added = await upload(input.files)
    input.value = ''
    if (added.length === 1) return choose(added[0]!)
    items.value = [...added, ...items.value]
}

function choose(item: MediaItem) {
    emit('pick', item)
    open.value = false
}
</script>

<template>
    <span class="mp">
        <button class="btn btn-ghost btn-sm" type="button" @click="show">Choose image</button>
        <div v-if="open" class="mp-back" @click.self="open = false" @keydown.esc="open = false">
            <div class="panel mp-box" role="dialog" aria-modal="true" aria-labelledby="mp-h">
                <div class="mp-head">
                    <h2 id="mp-h">Choose an image</h2>
                    <label class="btn btn-dark btn-sm">
                        {{ uploading ? 'Uploading…' : 'Upload' }}
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple class="visually-hidden" @change="onFiles">
                    </label>
                    <button class="btn btn-plain btn-sm" type="button" aria-label="Close" @click="open = false">✕</button>
                </div>
                <p v-if="error" class="error-box" role="alert">{{ error }}</p>
                <p v-if="loading" class="muted">Loading…</p>
                <p v-else-if="!items.length" class="muted">No images yet. Upload one to get started.</p>
                <ul v-else class="mp-grid">
                    <li v-for="m in items" :key="m.id">
                        <button type="button" class="mp-item" :title="m.filename" @click="choose(m)">
                            <img :src="m.url" :alt="m.alt || m.filename" loading="lazy">
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </span>
</template>

<style scoped>
.mp-back { align-items: center; background: rgb(20 24 33 / 45%); display: flex; inset: 0; justify-content: center; padding: 16px; position: fixed; z-index: 60; }
.mp-box { display: flex; flex-direction: column; gap: 14px; max-height: 85vh; max-width: 760px; overflow: auto; padding: 20px; width: 100%; }
.mp-head { align-items: center; display: flex; gap: 10px; }
.mp-head h2 { flex: 1; font-size: 18px; margin: 0; }
.mp-head label { cursor: pointer; }
.mp-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); list-style: none; margin: 0; padding: 0; }
.mp-item { aspect-ratio: 1; background: var(--mist); border: 0; border-radius: var(--radius); cursor: pointer; overflow: hidden; padding: 0; width: 100%; }
.mp-item:hover, .mp-item:focus-visible { outline: 3px solid var(--quarry); outline-offset: 2px; }
.mp-item img { height: 100%; object-fit: cover; width: 100%; }
</style>
