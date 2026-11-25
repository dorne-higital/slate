<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const fetcher = useRequestFetch()
const category = computed(() => (typeof route.query.category === 'string' ? route.query.category : ''))

const { data, error } = await useAsyncData(() => `blog-${category.value}`, () => fetcher('/api/public/blog', { query: category.value ? { category: category.value } : {} }), { watch: [category] })
if (error.value && !data.value) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })

useSiteSeo(() => data.value && {
    title: fullTitle({ title: data.value.category ? `${data.value.category.name}: Blog` : 'Blog' }, data.value.site.name, data.value.site.seo),
    shortTitle: 'Blog',
    description: data.value.site.seo.defaultDescription,
    image: data.value.site.seo.defaultShareImage,
    url: `https://${data.value.site.address}/blog${data.value.category ? `?category=${data.value.category.slug}` : ''}`,
    siteName: data.value.site.name
})
useHead(() => ({ link: data.value ? [{ rel: 'alternate', type: 'application/rss+xml', title: `${data.value.site.name} blog`, href: '/blog/rss.xml' }] : [] }))
</script>

<template>
    <SiteShell v-if="data" :site="data.site" :menus="data.menus">
        <section class="blk">
            <div class="blk-inner">
                <h1>{{ data.category ? data.category.name : 'Blog' }}</h1>
                <nav v-if="data.categories.length" class="cats" aria-label="Categories">
                    <NuxtLink to="/blog" :class="{ on: !data.category }">All</NuxtLink>
                    <NuxtLink v-for="c in data.categories" :key="c.slug" :to="`/blog?category=${c.slug}`" :class="{ on: data.category?.slug === c.slug }">{{ c.name }}</NuxtLink>
                </nav>
                <div v-if="data.posts.length" class="grid">
                    <PostCard v-for="p in data.posts" :key="p.slug" :post="p" />
                </div>
                <p v-else class="blk-muted">No posts yet. Check back soon.</p>
            </div>
        </section>
    </SiteShell>
</template>

<style scoped>
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: clamp(36px, 5vw, 52px); font-weight: 800; letter-spacing: -.03em; margin: 0; }
.cats { display: flex; flex-wrap: wrap; gap: 8px; }
.cats a { border: 1.5px solid color-mix(in srgb, var(--site-text) 25%, transparent); border-radius: 999px; color: var(--site-heading); font-size: 14px; font-weight: 600; padding: 6px 14px; text-decoration: none; }
.cats a.on { background: var(--site-primary); border-color: var(--site-primary); color: var(--site-primary-text); }
.grid { display: grid; gap: 40px 32px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); margin-top: 12px; }
</style>
