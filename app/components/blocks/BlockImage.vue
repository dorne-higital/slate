<script setup lang="ts">
defineProps<{ url?: string, alt?: string, width?: string, caption?: string }>()
</script>

<template>
    <section class="blk">
        <figure :class="choice('image', 'width', width) === 'full' ? 'full' : 'blk-inner'">
            <img v-if="url" :src="url" :alt="alt || ''" loading="lazy">
            <div v-else class="empty">Choose an image.</div>
            <figcaption v-if="caption" class="blk-muted">{{ caption }}</figcaption>
        </figure>
    </section>
</template>

<style scoped>
figure { margin: 0 auto; }
img { border-radius: var(--site-card-radius); display: block; height: auto; width: 100%; }
.full img { border-radius: 0; }
.full figcaption { padding: 0 24px; }
figcaption { font-size: 14px; margin-top: 10px; }
.empty { background: var(--site-surface); border-radius: 8px; color: var(--site-muted); padding: 80px; text-align: center; }
</style>
