<script setup lang="ts">
// Words on one side, a video or picture on the other.
defineProps<{ title: string, text: string, points?: string[], video?: string, videoCaption?: string, image?: string, imageAlt?: string, flip?: boolean, eyebrow?: string }>()
</script>

<template>
    <section class="mk-split">
        <div class="mk-wrap grid" :class="{ flip }">
            <div class="copy">
                <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
                <h2>{{ title }}</h2>
                <p class="text">{{ text }}</p>
                <ul v-if="points?.length" class="ticks">
                    <li v-for="p in points" :key="p">{{ p }}</li>
                </ul>
                <slot />
            </div>
            <div v-if="video || image || $slots.media" class="media">
                <slot name="media">
                    <MkVideo v-if="video" :name="video" :caption="videoCaption ?? ''" />
                    <img v-else-if="image" :src="image" :alt="imageAlt ?? ''" loading="lazy" width="1200" height="750">
                </slot>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mk-split { padding: 72px 0; }
.grid { align-items: center; display: grid; gap: 64px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); }
.grid.flip .copy { order: 2; }
.copy { display: flex; flex-direction: column; gap: 18px; }
.eyebrow { color: var(--heather); font-size: 14px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h2 { font-size: clamp(30px, 3.4vw, 42px); font-weight: 800; letter-spacing: -.035em; line-height: 1.06; margin: 0; }
.text { color: var(--text-body); font-size: 18px; line-height: 1.6; margin: 0; }
.ticks { display: flex; flex-direction: column; gap: 10px; list-style: none; margin: 0; padding: 0; }
.ticks li { color: var(--text-body); font-size: 16px; line-height: 1.5; padding-left: 30px; position: relative; }
.ticks li::before { border-bottom: 2.4px solid var(--heather); border-left: 2.4px solid var(--heather); content: ''; height: 6px; left: 4px; position: absolute; top: 6px; transform: rotate(-45deg); width: 12px; }
.media img { border-radius: 12px; box-shadow: 0 0 0 1px var(--line); display: block; height: auto; width: 100%; }
@media (max-width: 960px) { .grid { gap: 36px; grid-template-columns: minmax(0, 1fr); } .grid.flip .copy { order: 0; } .mk-split { padding: 48px 0; } }
</style>
