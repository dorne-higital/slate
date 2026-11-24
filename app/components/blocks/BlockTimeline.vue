<script setup lang="ts">
defineProps<{ eyebrow?: string, heading?: string, items?: { when?: string, title?: string, text?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner narrow">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <ol class="tl">
                <li v-for="(e, i) in items" :key="i">
                    <span class="when">{{ e.when }}</span>
                    <div class="what">
                        <b>{{ e.title }}</b>
                        <p v-if="e.text" class="blk-muted">{{ e.text }}</p>
                    </div>
                </li>
            </ol>
        </div>
    </section>
</template>

<style scoped>
.narrow { max-width: 860px; }
.tl { list-style: none; margin: 0; padding: 0; }
li { display: grid; gap: 24px; grid-template-columns: 160px minmax(0, 1fr); padding: 0 0 28px; position: relative; }
li::before { background: color-mix(in srgb, currentcolor 15%, transparent); bottom: 0; content: ''; left: 172px; position: absolute; top: 10px; width: 2px; }
li::after { background: var(--site-primary); border-radius: 50%; content: ''; height: 12px; left: 167px; position: absolute; top: 6px; width: 12px; }
.when { color: var(--site-muted); font-weight: 700; }
.what { display: flex; flex-direction: column; gap: 6px; padding-left: 24px; }
b { color: var(--site-heading); font-size: 19px; }
@media (max-width: 600px) { li { grid-template-columns: minmax(0, 1fr); gap: 4px; padding-left: 24px; } li::before { left: 5px; } li::after { left: 0; } .what { padding-left: 0; } }
</style>
