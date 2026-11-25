<script setup lang="ts">
/**
 * Google Maps for an address. The map only loads when the visitor asks (or has already accepted cookies),
 * because Google's embed can set cookies. "Get directions" always works.
 */
const props = defineProps<{ eyebrow?: string, heading?: string, address?: string, zoom?: string, height?: string }>()
const preview = inject<boolean>('blockPreview', false)
const place = computed(() => (props.address ?? '').split('\n').map(l => l.trim()).filter(Boolean).join(', '))
const z = computed(() => ({ street: 16, area: 14, town: 12 } as Record<string, number>)[choice('map', 'zoom', props.zoom)] ?? 16)
const h = computed(() => choice('map', 'height', props.height))
const src = computed(() => `https://www.google.com/maps?q=${encodeURIComponent(place.value)}&z=${z.value}&output=embed`)
const directions = computed(() => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.value)}`)

const KEY = 'slate-maps-ok'
const show = ref(false)
onMounted(() => {
    if (preview) return
    try {
        show.value = localStorage.getItem(KEY) === 'yes' || localStorage.getItem('slate-cookie-consent') === 'yes'
    } catch {
        // Storage blocked: ask each time
    }
})
function load() {
    show.value = true
    try {
        localStorage.setItem(KEY, 'yes')
    } catch {
        // Only for this visit
    }
}
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <div class="map" :class="`h-${h}`">
                <iframe v-if="show && place" :src="src" :title="`Map of ${place}`" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen />
                <div v-else class="cover">
                    <span class="pin" aria-hidden="true">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                    </span>
                    <b v-if="place">{{ place }}</b>
                    <b v-else>Add an address to show a map</b>
                    <div v-if="place" class="actions">
                        <button v-if="!preview" type="button" class="blk-btn" @click="load">Show map</button>
                        <span v-else class="blk-btn" aria-hidden="true">Show map</span>
                        <a class="blk-btn outline" :href="directions" target="_blank" rel="noopener">Get directions</a>
                    </div>
                    <span v-if="place" class="note">The map comes from Google, which may set cookies.</span>
                </div>
            </div>
            <p v-if="show && place" class="after"><a :href="directions" target="_blank" rel="noopener">Get directions</a></p>
        </div>
    </section>
</template>

<style scoped>
.map { border-radius: var(--site-card-radius, 16px); overflow: hidden; position: relative; }
.h-short { height: 300px; }
.h-medium { height: 440px; }
.h-tall { height: 600px; }
iframe { border: 0; display: block; height: 100%; width: 100%; }
.cover {
    align-items: center;
    background:
        linear-gradient(color-mix(in srgb, var(--site-surface) 70%, transparent), color-mix(in srgb, var(--site-surface) 70%, transparent)),
        repeating-linear-gradient(32deg, transparent 0 46px, color-mix(in srgb, var(--site-text) 7%, transparent) 46px 49px),
        repeating-linear-gradient(-58deg, transparent 0 70px, color-mix(in srgb, var(--site-text) 6%, transparent) 70px 76px),
        var(--site-surface);
    display: flex;
    flex-direction: column;
    gap: 14px;
    height: 100%;
    justify-content: center;
    padding: 24px;
    text-align: center;
}
.pin { align-items: center; background: var(--site-primary); border-radius: 50%; color: var(--site-primary-text); display: flex; height: 58px; justify-content: center; width: 58px; }
.cover b { color: var(--site-heading); font-size: 18px; max-width: 30em; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
button.blk-btn { cursor: pointer; font: inherit; font-weight: 700; }
.note { color: var(--site-muted); font-size: 13px; }
.after { margin: 12px 0 0; }
@media (max-width: 600px) { .h-tall, .h-medium { height: 380px; } }
</style>
