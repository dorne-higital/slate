<script setup lang="ts">
defineProps<{ eyebrow?: string, heading?: string, intro?: string, items?: { title?: string, text?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" :intro="intro" />
            <ol class="steps">
                <li v-for="(s, i) in items" :key="i">
                    <span class="n" aria-hidden="true">{{ String(i + 1).padStart(2, '0') }}</span>
                    <b>{{ s.title }}</b>
                    <span class="blk-muted">{{ s.text }}</span>
                </li>
            </ol>
        </div>
    </section>
</template>

<style scoped>
.steps { counter-reset: s; display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); list-style: none; margin: 8px 0 0; padding: 0; }
li { border-top: 2px solid color-mix(in srgb, currentcolor 15%, transparent); display: flex; flex-direction: column; gap: 8px; padding-top: 20px; }
.n { color: var(--site-primary); font-family: var(--site-heading-font); font-size: 40px; font-weight: 800; line-height: 1; }
b { color: var(--site-heading); font-size: 20px; }
</style>
