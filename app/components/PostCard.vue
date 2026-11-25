<script setup lang="ts">
defineProps<{ post: { title: string, slug: string, summary: string, coverImage: string | null, publishedAt: string, category: { name: string } | null }, preview?: boolean }>()
const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
    <article class="card">
        <component :is="preview ? 'span' : resolveComponent('NuxtLink')" :to="`/blog/${post.slug}`" class="link">
            <img v-if="post.coverImage" :src="post.coverImage" alt="" class="cover" loading="lazy">
            <span v-else class="cover blank" aria-hidden="true" />
            <span class="meta">{{ date(post.publishedAt) }}<template v-if="post.category"> · {{ post.category.name }}</template></span>
            <b class="title">{{ post.title }}</b>
            <span class="summary">{{ post.summary }}</span>
        </component>
    </article>
</template>

<style scoped>
.card { display: flex; }
.link { color: inherit; display: flex; flex-direction: column; gap: 10px; text-decoration: none; }
.link:hover .title { text-decoration: underline; text-underline-offset: 4px; }
.cover { aspect-ratio: 16 / 10; border-radius: var(--site-card-radius); object-fit: cover; width: 100%; }
.cover.blank { background: var(--site-surface); display: block; }
.meta { color: var(--site-muted); font-size: 14px; }
.title { color: var(--site-heading); font-family: var(--site-heading-font); font-size: 21px; line-height: 1.25; }
.summary { color: var(--site-muted); line-height: 1.55; }
</style>
