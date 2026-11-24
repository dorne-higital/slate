<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, url?: string, caption?: string }>()
// Only YouTube and Vimeo, embedded through their privacy-friendly players
const embed = computed(() => {
    const u = props.url ?? ''
    const yt = /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/.exec(u)
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`
    const vm = /vimeo\.com\/(?:video\/)?(\d{6,12})/.exec(u)
    if (vm) return `https://player.vimeo.com/video/${vm[1]}?dnt=1`
    return ''
})
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <BlockHeading :eyebrow="eyebrow" :heading="heading" />
            <figure class="fig">
                <iframe v-if="embed" :src="embed" :title="heading || caption || 'Video'" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen />
                <div v-else class="empty">Paste a YouTube or Vimeo link.</div>
                <figcaption v-if="caption" class="blk-muted">{{ caption }}</figcaption>
            </figure>
        </div>
    </section>
</template>

<style scoped>
.fig { display: flex; flex-direction: column; gap: 10px; margin: 0; }
iframe { aspect-ratio: 16 / 9; border: 0; border-radius: var(--site-card-radius); width: 100%; }
.empty { align-items: center; aspect-ratio: 16 / 9; background: var(--site-surface); border-radius: 8px; color: var(--site-muted); display: flex; justify-content: center; }
</style>
