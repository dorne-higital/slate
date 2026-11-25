<script setup lang="ts">
defineProps<{ eyebrow?: string, text?: string, byline?: string }>()
</script>

<template>
    <section class="blk">
        <figure class="blk-inner big">
            <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
            <blockquote>{{ text }}</blockquote>
            <figcaption v-if="byline" class="blk-muted">— {{ byline }}</figcaption>
        </figure>
    </section>
</template>

<style scoped>
.big { margin: 0 auto; max-width: 1000px; }
blockquote { color: var(--site-heading); font-family: var(--site-heading-font); font-size: clamp(28px, 4.4vw, 52px); font-weight: 800; letter-spacing: -.02em; line-height: 1.15; margin: 0; text-transform: var(--site-heading-case, none); }
figcaption { font-size: 17px; font-weight: 600; }
</style>
