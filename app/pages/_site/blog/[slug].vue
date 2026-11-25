<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const fetcher = useRequestFetch()
const slug = computed(() => String(route.params.slug))

const { data, error } = await useAsyncData(() => `post-${slug.value}`, () => fetcher(`/api/public/blog/${encodeURIComponent(slug.value)}`), { watch: [slug] })
if (error.value && !data.value) throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })

useSiteSeo(() => data.value && {
    title: fullTitle({ title: data.value.post.title }, data.value.site.name, data.value.site.seo),
    shortTitle: data.value.post.title,
    description: data.value.post.summary,
    image: data.value.post.coverImage || data.value.site.seo.defaultShareImage,
    url: `https://${data.value.site.address}/blog/${data.value.post.slug}`,
    siteName: data.value.site.name,
    type: 'article'
})
const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
    <SiteShell v-if="data" :site="data.site" :menus="data.menus">
        <article class="blk">
            <div class="blk-inner narrow">
                <NuxtLink to="/blog" class="back">← Blog</NuxtLink>
                <header class="head">
                    <span class="meta">
                        {{ date(data.post.publishedAt) }} · {{ data.post.minutes }} min read
                        <template v-if="data.post.category"> · <NuxtLink :to="`/blog?category=${data.post.category.slug}`">{{ data.post.category.name }}</NuxtLink></template>
                    </span>
                    <h1>{{ data.post.title }}</h1>
                    <span v-if="data.post.author" class="meta">By {{ data.post.author }}</span>
                </header>
                <img v-if="data.post.coverImage" :src="data.post.coverImage" alt="" class="cover">
                <PostBody :body="data.post.body" />
            </div>
        </article>
        <section v-if="data.more.length" class="blk blk-alt">
            <div class="blk-inner">
                <h2>More from the blog</h2>
                <div class="grid"><PostCard v-for="p in data.more" :key="p.slug" :post="p" /></div>
            </div>
        </section>
    </SiteShell>
</template>

<style scoped>
.narrow { max-width: 760px; }
.back { color: var(--site-muted); font-size: 15px; text-decoration: none; }
.back:hover { text-decoration: underline; }
.head { display: flex; flex-direction: column; gap: 12px; }
h1 { color: var(--site-heading); font-family: var(--site-heading-font); font-size: clamp(34px, 5vw, 50px); font-weight: 800; letter-spacing: -.03em; line-height: 1.08; margin: 0; }
.meta { color: var(--site-muted); font-size: 15px; }
.meta a { color: inherit; }
.cover { aspect-ratio: 16 / 9; border-radius: var(--site-card-radius); margin: 8px 0; object-fit: cover; width: 100%; }
.grid { display: grid; gap: 32px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); margin-top: 8px; }
</style>
