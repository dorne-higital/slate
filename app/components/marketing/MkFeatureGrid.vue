<script setup lang="ts">
defineProps<{ items: { icon: string, title: string, text: string, to?: string }[], columns?: 2 | 3 | 4 }>()
</script>

<template>
    <ul class="mk-grid" :style="{ '--cols': columns ?? 3 }">
        <li v-for="i in items" :key="i.title">
            <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(i.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <h3>
                <NuxtLink v-if="i.to" :to="i.to">{{ i.title }}</NuxtLink>
                <template v-else>{{ i.title }}</template>
            </h3>
            <p>{{ i.text }}</p>
        </li>
    </ul>
</template>

<style scoped>
.mk-grid { display: grid; gap: 20px; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
li { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); display: flex; flex-direction: column; gap: 10px; padding: 24px; position: relative; }
li:has(a):hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
svg { color: var(--heather); }
h3 { font-size: 18px; margin: 0; }
h3 a { color: inherit; text-decoration: none; }
h3 a::after { content: ''; inset: 0; position: absolute; }
p { color: var(--text-body); font-size: 15.5px; line-height: 1.55; margin: 0; }
@media (max-width: 960px) { .mk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .mk-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
