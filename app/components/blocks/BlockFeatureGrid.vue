<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, columns?: string, style?: string, items?: { icon?: string, title?: string, text?: string }[] }>()
const cols = computed(() => choice('featureGrid', 'columns', props.columns))
const cards = computed(() => choice('featureGrid', 'style', props.style) === 'cards')
const list = computed(() => (props.items ?? []).map(f => ({ ...f, path: showcaseIcon(f.icon) })))
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <div v-if="eyebrow || heading || intro" class="blk-head centre">
                <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                <h2 v-if="heading">{{ heading }}</h2>
                <p v-if="intro" class="blk-muted">{{ intro }}</p>
            </div>
            <ul class="grid" :class="[`c-${cols}`, { cards }]">
                <li v-for="(f, i) in list" :key="i" :class="{ 'blk-card': cards }">
                    <span class="icon" aria-hidden="true">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path :d="f.path" /></svg>
                    </span>
                    <h3 v-if="f.title">{{ f.title }}</h3>
                    <p v-if="f.text" class="blk-muted">{{ f.text }}</p>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 20px; list-style: none; margin: 20px 0 0; padding: 0; }
.c-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.c-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.c-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
li { display: flex; flex-direction: column; gap: 12px; }
.cards li { padding: 26px; }
.icon { align-items: center; background: color-mix(in srgb, var(--site-primary) 13%, transparent); border-radius: 12px; color: var(--site-primary); display: flex; height: 48px; justify-content: center; width: 48px; }
h3 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: 19px; margin: 0; }
li p { font-size: 15px; line-height: 1.55; }
@media (max-width: 900px) { .c-3, .c-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .grid { grid-template-columns: minmax(0, 1fr) !important; } }
</style>
