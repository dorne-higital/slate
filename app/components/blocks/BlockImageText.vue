<script setup lang="ts">
const props = defineProps<{ heading?: string, body?: string, imageUrl?: string, imageAlt?: string }>()
const paras = computed(() => paragraphs(props.body))
</script>

<template>
    <section class="blk">
        <div class="blk-inner split">
            <img v-if="imageUrl" :src="imageUrl" :alt="imageAlt || ''" class="pic" loading="lazy">
            <div v-else class="pic placeholder" aria-hidden="true">Image</div>
            <div class="words">
                <h2 v-if="heading">{{ heading }}</h2>
                <p v-for="(p, i) in paras" :key="i">{{ p }}</p>
            </div>
        </div>
    </section>
</template>

<style scoped>
.split { align-items: center; display: grid; gap: 48px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.pic { aspect-ratio: 4 / 3; border-radius: var(--site-card-radius); object-fit: cover; width: 100%; }
.placeholder { align-items: center; background: var(--site-surface); color: var(--site-muted); display: flex; font-size: 14px; justify-content: center; }
.words { display: flex; flex-direction: column; gap: 18px; }
@media (max-width: 760px) { .split { gap: 24px; grid-template-columns: minmax(0, 1fr); } }
</style>
