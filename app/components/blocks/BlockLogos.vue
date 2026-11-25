<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, style?: string, items?: { name?: string, logo?: string, url?: string }[] }>()
const look = computed(() => choice('logos', 'style', props.style))
</script>

<template>
    <section class="blk" :class="`lg-${look}`">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <div class="viewport">
                <ul class="row" :class="{ scroll: look === 'scroll' }">
                    <li v-for="n in (look === 'scroll' ? 2 : 1)" :key="n" class="set" :aria-hidden="n === 2 || undefined">
                        <component :is="it.url ? 'a' : 'span'" v-for="(it, i) in items" :key="i" :href="it.url || undefined" class="item" :class="{ tag: look === 'tags' }" target="_blank" rel="noopener">
                            <img v-if="look !== 'tags' && it.logo" :src="it.logo" :alt="it.name || ''" loading="lazy">
                            <template v-else>{{ it.name }}</template>
                        </component>
                    </li>
                </ul>
            </div>
        </div>
    </section>
</template>

<style scoped>
.row { list-style: none; margin: 0; padding: 0; }
.set { align-items: center; display: flex; flex-wrap: wrap; gap: 12px 40px; }
.lg-tags .set { gap: 10px; }
.item { align-items: center; color: var(--site-heading); display: inline-flex; font-weight: 700; text-decoration: none; }
.item img { filter: grayscale(1); height: 40px; max-width: 160px; object-fit: contain; opacity: .8; transition: filter .2s, opacity .2s; }
.item:hover img { filter: none; opacity: 1; }
.tag { background: var(--site-surface); border-radius: 999px; font-size: 15px; padding: 8px 16px; }
.viewport { overflow: hidden; }
.scroll { animation: slide 40s linear infinite; display: flex; gap: 40px; width: max-content; }
.scroll .set { flex-wrap: nowrap; }
@keyframes slide { to { transform: translateX(calc(-50% - 20px)); } }
@media (prefers-reduced-motion: reduce) { .scroll { animation: none; flex-wrap: wrap; width: auto; } .scroll .set + .set { display: none; } }
</style>
