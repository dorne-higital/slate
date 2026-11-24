<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, columns?: string, shape?: string, items?: { url?: string, alt?: string, caption?: string }[] }>()
const preview = inject<boolean>('blockPreview', false)
const images = computed(() => (props.items ?? []).filter(i => i.url))
const cols = computed(() => Number(choice('gallery', 'columns', props.columns)))
const shape = computed(() => choice('gallery', 'shape', props.shape))

// Lightbox: click an image to see it large; arrows and Escape work
const open = ref<number | null>(null)
const show = (i: number) => { if (!preview) open.value = i }
const move = (d: number) => { if (open.value !== null) open.value = (open.value + d + images.value.length) % images.value.length }
function onKey(e: KeyboardEvent) {
    if (open.value === null) return
    if (e.key === 'Escape') open.value = null
    if (e.key === 'ArrowRight') move(1)
    if (e.key === 'ArrowLeft') move(-1)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <ul v-if="images.length" class="grid" :class="`sh-${shape}`" :style="{ '--cols': cols }">
                <li v-for="(img, i) in images" :key="i">
                    <figure>
                        <button type="button" class="shot" :aria-label="`View ${img.alt || `image ${i + 1}`} larger`" @click="show(i)">
                            <img :src="img.url" :alt="img.alt || ''" loading="lazy">
                        </button>
                        <figcaption v-if="img.caption" class="blk-muted">{{ img.caption }}</figcaption>
                    </figure>
                </li>
            </ul>
            <p v-else-if="preview" class="empty">Add images to this gallery in the panel on the right.</p>
        </div>
        <div v-if="open !== null" class="lb" role="dialog" aria-modal="true" aria-label="Image viewer" @click.self="open = null">
            <img :src="images[open]!.url" :alt="images[open]!.alt || ''">
            <p v-if="images[open]!.caption" class="lb-cap">{{ images[open]!.caption }}</p>
            <button type="button" class="lb-btn close" aria-label="Close" @click="open = null">✕</button>
            <template v-if="images.length > 1">
                <button type="button" class="lb-btn prev" aria-label="Previous image" @click="move(-1)">‹</button>
                <button type="button" class="lb-btn next" aria-label="Next image" @click="move(1)">›</button>
            </template>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 20px; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
figure { display: flex; flex-direction: column; gap: 8px; margin: 0; }
.shot { background: var(--site-surface); border: 0; border-radius: var(--site-card-radius); cursor: zoom-in; display: block; overflow: hidden; padding: 0; width: 100%; }
.shot img { display: block; height: auto; transition: transform .3s; width: 100%; }
.shot:hover img { transform: scale(1.03); }
.sh-square .shot img { aspect-ratio: 1; object-fit: cover; }
.sh-wide .shot img { aspect-ratio: 16 / 10; object-fit: cover; }
.sh-phone .shot img { aspect-ratio: 9 / 19; object-fit: cover; object-position: top; }
figcaption { font-size: 14px; }
.empty { background: var(--site-surface); border-radius: 8px; color: var(--site-muted); padding: 40px; text-align: center; }
.lb { align-items: center; background: rgb(10 10 12 / 92%); display: flex; flex-direction: column; gap: 12px; inset: 0; justify-content: center; padding: 48px 64px; position: fixed; z-index: 100; }
.lb img { max-height: 84vh; max-width: 100%; object-fit: contain; }
.lb-cap { color: #ddd; margin: 0; }
.lb-btn { background: rgb(255 255 255 / 12%); border: 0; border-radius: 50%; color: #fff; cursor: pointer; font-size: 24px; height: 44px; position: absolute; width: 44px; }
.close { right: 16px; top: 16px; }
.prev { left: 12px; top: 50%; }
.next { right: 12px; top: 50%; }
@media (max-width: 800px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .lb { padding: 56px 12px; } }
</style>
