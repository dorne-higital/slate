<script setup lang="ts">
defineProps<{ eyebrow?: string, heading?: string, items?: { value?: string, label?: string }[] }>()
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <dl class="stats">
                <div v-for="(s, i) in items" :key="i" class="stat">
                    <dt class="blk-muted">{{ s.label }}</dt>
                    <dd class="num">{{ s.value }}</dd>
                </div>
            </dl>
        </div>
    </section>
</template>

<style scoped>
.stats { display: grid; gap: 32px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: 0; }
.stat { display: flex; flex-direction: column-reverse; gap: 6px; }
.num { color: var(--site-primary); font-family: var(--site-heading-font); font-size: clamp(44px, 6vw, 72px); font-weight: 800; letter-spacing: -.03em; line-height: 1; margin: 0; }
dt { font-size: 16px; font-weight: 600; }
</style>
