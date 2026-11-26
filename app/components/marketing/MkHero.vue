<script setup lang="ts">
// The top of a marketing page: what it is, one main action, and a video or picture of the real thing.
defineProps<{ eyebrow?: string, title: string, lead: string, video?: string, videoCaption?: string, image?: string, imageAlt?: string, secondary?: { label: string, to: string } }>()
</script>

<template>
    <section class="mk-hero">
        <div class="mk-wrap grid" :class="{ solo: !video && !image && !$slots.media }">
            <div class="copy">
                <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
                <h1>{{ title }}</h1>
                <p class="lead">{{ lead }}</p>
                <div class="ctas">
                    <NuxtLink class="btn btn-lichen btn-xl" to="/signup">Start your free trial</NuxtLink>
                    <NuxtLink v-if="secondary" class="btn btn-outline btn-xl" :to="secondary.to">{{ secondary.label }}</NuxtLink>
                </div>
                <p class="small">{{ TRIAL_DAYS }} days free with everything included. No card needed.</p>
            </div>
            <div v-if="video || image || $slots.media" class="media">
                <slot name="media">
                    <MkVideo v-if="video" :name="video" :caption="videoCaption ?? ''" />
                    <img v-else-if="image" :src="image" :alt="imageAlt ?? ''" width="1200" height="750" fetchpriority="high">
                </slot>
            </div>
        </div>
    </section>
</template>

<style scoped>
.mk-hero { padding: 64px 0 88px; }
.grid { align-items: center; display: grid; gap: 56px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); }
.grid.solo { grid-template-columns: minmax(0, 1fr); max-width: 880px; }
.copy { display: flex; flex-direction: column; gap: 24px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 66px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 32em; }
.ctas { display: flex; flex-wrap: wrap; gap: 12px; }
.small { color: var(--text-muted); font-size: 15px; margin: 0; }
.media img { border-radius: 12px; display: block; height: auto; width: 100%; }
@media (max-width: 960px) { .grid { gap: 40px; grid-template-columns: minmax(0, 1fr); } .mk-hero { padding: 40px 0 64px; } }
</style>
