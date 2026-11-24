<script setup lang="ts">
defineProps<{ heading?: string, text?: string, buttonLabel?: string, buttonUrl?: string }>()
</script>

<template>
    <section class="blk hero">
        <div class="blk-inner">
            <h1>{{ heading }}</h1>
            <p v-if="text" class="blk-muted lead">{{ text }}</p>
            <a v-if="buttonLabel" class="blk-btn" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
        </div>
    </section>
</template>

<style scoped>
.hero { padding: 104px 0 88px; }
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: clamp(40px, 6vw, 64px); font-weight: 800; letter-spacing: -.035em; line-height: 1.02; margin: 0; max-width: 16em; }
.lead { font-size: 19px; max-width: 36em; }
</style>
