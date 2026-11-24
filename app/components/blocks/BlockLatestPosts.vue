<script setup lang="ts">
const props = defineProps<{ eyebrow?: string, heading?: string, count?: string }>()
const posts = inject<Ref<PostCardData[]>>('sitePosts', ref([]))
const preview = inject<boolean>('blockPreview', false)
const shown = computed(() => posts.value.slice(0, Math.min(12, Math.max(1, Number.parseInt(props.count ?? '3') || 3))))

interface PostCardData { title: string, slug: string, summary: string, coverImage: string | null, publishedAt: string, category: { name: string } | null }
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <div class="top">
                <BlockHeading :eyebrow="eyebrow" :heading="heading" />
                <component :is="preview ? 'span' : resolveComponent('NuxtLink')" to="/blog" class="all">All posts</component>
            </div>
            <div v-if="shown.length" class="grid">
                <PostCard v-for="p in shown" :key="p.slug" :post="p" :preview="preview" />
            </div>
            <p v-else-if="preview" class="blk-muted empty">Your newest published posts will show here.</p>
        </div>
    </section>
</template>

<style scoped>
.top { align-items: baseline; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
.all { color: var(--site-heading); font-weight: 600; }
.grid { display: grid; gap: 32px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); margin-top: 8px; }
.empty { background: var(--site-surface); border-radius: 8px; padding: 24px; }
</style>
