<script setup lang="ts">
// Pictures in a row that scrolls sideways: swipe on phones, arrows and dots on computers.
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, frame?: string, items?: { imageUrl?: string, imageAlt?: string, title?: string, text?: string }[] }>()
const frame = computed(() => choice('carousel', 'frame', props.frame))
const list = computed(() => props.items ?? [])
const track = ref<HTMLElement | null>(null)
const current = ref(0)
const uid = useId()

function slides() {
    return track.value ? [...track.value.children] as HTMLElement[] : []
}
function go(i: number) {
    const all = slides()
    const target = all[Math.max(0, Math.min(i, all.length - 1))]
    if (!track.value || !target) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.value.scrollTo({ left: target.offsetLeft - track.value.offsetLeft, behavior: reduce ? 'auto' : 'smooth' })
}
function onScroll() {
    const t = track.value
    if (!t) return
    const all = slides()
    let best = 0
    all.forEach((s, i) => {
        if (Math.abs(s.offsetLeft - t.offsetLeft - t.scrollLeft) < Math.abs(all[best]!.offsetLeft - t.offsetLeft - t.scrollLeft)) best = i
    })
    current.value = best
}
const atEnd = ref(false)
function update() {
    onScroll()
    const t = track.value
    atEnd.value = !!t && t.scrollLeft + t.clientWidth >= t.scrollWidth - 4
}
</script>

<template>
    <section class="blk carousel" :class="`f-${frame}`">
        <div class="blk-inner">
            <div class="head">
                <div class="blk-head">
                    <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                    <h2 v-if="heading">{{ heading }}</h2>
                    <p v-if="intro" class="blk-muted">{{ intro }}</p>
                </div>
                <div v-if="list.length > 1" class="arrows">
                    <button type="button" class="arrow" :aria-controls="uid" aria-label="Previous picture" :disabled="current === 0" @click="go(current - 1)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
                    </button>
                    <button type="button" class="arrow" :aria-controls="uid" aria-label="Next picture" :disabled="atEnd" @click="go(current + 1)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                    </button>
                </div>
            </div>
            <ul :id="uid" ref="track" class="track" tabindex="0" :aria-label="heading || 'Pictures'" @scroll.passive="update">
                <li v-for="(s, i) in list" :key="i" class="slide">
                    <figure>
                        <ShowcaseFrame :kind="frame" :src="s.imageUrl" :alt="s.imageAlt" />
                        <figcaption v-if="s.title || s.text"><b v-if="s.title">{{ s.title }}</b><span v-if="s.text" class="blk-muted">{{ s.text }}</span></figcaption>
                    </figure>
                </li>
            </ul>
            <div v-if="list.length > 1" class="dots" aria-hidden="true">
                <span v-for="(_, i) in list" :key="i" :class="{ on: i === current }" />
            </div>
        </div>
    </section>
</template>

<style scoped>
.carousel { overflow: hidden; }
.head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 20px; justify-content: space-between; margin-bottom: 32px; }
.arrows { display: flex; gap: 10px; }
.arrow { align-items: center; background: transparent; border: 0; border-radius: 50%; box-shadow: inset 0 0 0 1.5px currentcolor; color: var(--site-heading); cursor: pointer; display: flex; height: 48px; justify-content: center; width: 48px; }
.arrow:not(:disabled):hover { background: var(--site-heading); color: var(--site-bg); }
.arrow:disabled { cursor: default; opacity: .35; }
.track { display: flex; gap: 28px; list-style: none; margin: 0 calc(-1 * var(--blk-gutter, 24px)); overflow-x: auto; overscroll-behavior-x: contain; padding: 8px var(--blk-gutter, 24px) 28px; scroll-padding: 0 var(--blk-gutter, 24px); scroll-snap-type: x mandatory; scrollbar-width: none; }
.track::-webkit-scrollbar { display: none; }
.track:focus-visible { outline: 2px solid var(--site-primary); outline-offset: 2px; }
.slide { flex: none; scroll-snap-align: start; }
.f-phone .slide { width: min(230px, 62vw); }
.f-browser .slide, .f-photo .slide, .f-plain .slide { width: min(460px, 82vw); }
figure { display: flex; flex-direction: column; gap: 14px; margin: 0; }
figcaption { display: flex; flex-direction: column; font-size: 15px; gap: 2px; line-height: 1.45; max-width: 30em; }
.dots { display: flex; gap: 8px; }
.dots span { background: currentcolor; border-radius: 3px; height: 6px; opacity: .25; transition: width .2s; width: 6px; }
.dots span.on { opacity: 1; width: 24px; }
@media (prefers-reduced-motion: reduce) { .dots span { transition: none; } }
</style>
