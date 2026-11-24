<script setup lang="ts">
// Top of every project page: back link, name, intro, cover, details and links. Content blocks follow.
defineProps<{ title: string, project: ProjectMeta }>()
</script>

<template>
    <section class="blk ph">
        <div class="blk-inner">
            <a href="/work" class="back">← All work</a>
            <p v-if="project.category" class="blk-eyebrow">{{ project.category }}</p>
            <h1>{{ title }}</h1>
            <p v-if="project.summary" class="blk-muted lead">{{ project.summary }}</p>
            <div class="grid">
                <div class="cover">
                    <img v-if="project.cover" :src="project.cover" :alt="project.coverAlt || ''" fetchpriority="high">
                    <span v-else class="empty" aria-hidden="true" />
                </div>
                <aside class="side">
                    <dl>
                        <div v-if="project.year"><dt>Year</dt><dd>{{ project.year }}</dd></div>
                        <div v-for="(d, i) in project.details" :key="i"><dt>{{ d.label }}</dt><dd>{{ d.value }}</dd></div>
                    </dl>
                    <div v-if="project.links?.length" class="links">
                        <a v-for="(l, i) in project.links" :key="i" :href="l.url" class="blk-btn" :class="{ outline: i > 0 }" target="_blank" rel="noopener">{{ l.label }} ↗</a>
                    </div>
                </aside>
            </div>
        </div>
    </section>
</template>

<style scoped>
.ph { padding-top: 56px; }
.back { color: var(--site-primary); font-weight: 700; text-decoration: none; }
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: var(--site-h1-size, clamp(36px, 5vw, 60px)); font-weight: 800; letter-spacing: -.03em; line-height: 1.05; margin: 0; text-transform: var(--site-heading-case, none); }
.lead { font-size: 19px; max-width: 40em; }
.grid { align-items: start; border-top: 1px solid color-mix(in srgb, currentcolor 12%, transparent); display: grid; gap: 48px; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); margin-top: 8px; padding-top: 32px; }
.cover img { border-radius: calc(var(--site-card-radius) + 4px); display: block; height: auto; width: 100%; }
.empty { aspect-ratio: 16 / 10; background: var(--site-surface); border-radius: calc(var(--site-card-radius) + 4px); display: block; }
.side { display: flex; flex-direction: column; gap: 28px; }
dl { display: flex; flex-direction: column; gap: 20px; margin: 0; }
dt { color: var(--site-muted); font-size: 14px; font-weight: 600; }
dd { color: var(--site-heading); font-size: 18px; font-weight: 700; margin: 2px 0 0; }
.links { align-items: flex-start; display: flex; flex-direction: column; gap: 10px; }
@media (max-width: 800px) { .grid { gap: 28px; grid-template-columns: minmax(0, 1fr); } }
</style>
