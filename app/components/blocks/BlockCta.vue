<script setup lang="ts">
defineProps<{ heading?: string, text?: string, buttonLabel?: string, buttonUrl?: string }>()
</script>

<template>
    <section class="blk band">
        <div class="blk-inner">
            <h2>{{ heading }}</h2>
            <p v-if="text">{{ text }}</p>
            <a v-if="buttonLabel" class="blk-btn light" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
        </div>
    </section>
</template>

<style scoped>
.band { background: var(--site-dark); color: var(--site-on-dark); }
.band h2 { color: var(--site-on-dark); }
.band p { opacity: .85; }
.light { background: var(--site-primary); color: var(--site-primary-text); }
</style>
