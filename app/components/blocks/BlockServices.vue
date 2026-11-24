<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, intro?: string, columns?: string, items?: { title?: string, text?: string, icon?: string }[] }>()
const cols = computed(() => Number(choice('services', 'columns', props.columns)))
</script>

<template>
    <section class="blk blk-alt">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" :intro="intro" />
            <ul class="grid" :style="{ '--cols': cols }">
                <li v-for="(item, i) in items" :key="i" class="card">
                    <img v-if="item.icon" :src="item.icon" alt="" class="icon" loading="lazy">
                    <b>{{ item.title }}</b>
                    <span>{{ item.text }}</span>
                </li>
            </ul>
        </div>
    </section>
</template>

<style scoped>
.grid { display: grid; gap: 20px; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); list-style: none; margin: 8px 0 0; padding: 0; }
.card { background: var(--site-bg); border-radius: var(--site-card-radius); display: flex; flex-direction: column; gap: 8px; padding: 24px; }
.icon { height: 48px; margin-bottom: 6px; object-fit: contain; width: 48px; }
.card b { font-size: 19px; }
.card span { color: var(--site-muted); line-height: 1.55; }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
