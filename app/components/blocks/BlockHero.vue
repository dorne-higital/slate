<script setup lang="ts">
const props = defineProps<{ layout?: string, eyebrow?: string, heading?: string, text?: string, buttonLabel?: string, buttonUrl?: string, button2Label?: string, button2Url?: string, imageUrl?: string, imageAlt?: string }>()
const layout = computed(() => choice('hero', 'layout', props.layout))
</script>

<template>
    <section class="blk hero" :class="`l-${layout}`">
        <div class="blk-inner" :class="{ split: layout === 'split' }">
            <div class="words">
                <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                <h1>{{ heading }}</h1>
                <p v-if="text" class="blk-muted lead">{{ text }}</p>
                <div v-if="buttonLabel || button2Label" class="blk-btns">
                    <a v-if="buttonLabel" class="blk-btn" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
                    <a v-if="button2Label" class="blk-btn outline" :href="button2Url || '#'">{{ button2Label }}</a>
                </div>
            </div>
            <div v-if="layout === 'split'" class="art">
                <img v-if="imageUrl" :src="imageUrl" :alt="imageAlt || ''" fetchpriority="high">
                <div v-else class="art-empty" aria-hidden="true">Picture</div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.hero { padding: calc(var(--blk-pad, 72px) + 32px) 0 calc(var(--blk-pad, 72px) + 16px); }
.words { display: flex; flex-direction: column; gap: 22px; }
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: var(--site-h1-size, clamp(40px, 6vw, 64px)); text-transform: var(--site-heading-case, none); font-weight: 800; letter-spacing: -.035em; line-height: 1.02; margin: 0; max-width: 16em; }
.lead { font-size: 19px; max-width: 36em; }
.split { align-items: center; display: grid; gap: 56px; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
.art img { display: block; height: auto; max-height: 520px; object-fit: contain; width: 100%; }
.art-empty { align-items: center; aspect-ratio: 4 / 3; background: var(--site-surface); border-radius: var(--site-card-radius); color: var(--site-muted); display: flex; justify-content: center; }
.l-centred .words { align-items: center; margin: 0 auto; text-align: center; }
.l-centred h1, .l-centred .lead { margin-left: auto; margin-right: auto; }
.l-banner { background: var(--site-primary); color: var(--site-primary-text); text-align: center; }
.l-banner .words { align-items: center; }
.l-banner h1, .l-banner .lead, .l-banner .blk-eyebrow { color: var(--site-primary-text); margin-left: auto; margin-right: auto; }
.l-banner .blk-btn { background: var(--site-primary-text); color: var(--site-primary); }
.l-banner .blk-btn.outline { background: transparent; color: var(--site-primary-text); }
@media (max-width: 800px) { .split { gap: 32px; grid-template-columns: minmax(0, 1fr); } }
</style>
