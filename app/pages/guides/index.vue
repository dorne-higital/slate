<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const route = useRoute()
const category = computed(() => typeof route.query.category === 'string' ? route.query.category : '')
const { data } = await useFetch('/api/marketing/guides', { query: { category } })
const page = useMarketingSeo('/guides')
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
    <div>
        <section class="top mk-wrap">
            <p class="eyebrow">Guides</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">Plain-English help with getting found on Google, what to put on your site and the rules UK small businesses need to know. Free to read, whether you use Slate or not.</p>
            <nav v-if="data?.categories.length" class="cats" aria-label="Guide topics">
                <NuxtLink to="/guides" :class="{ on: !category }">All</NuxtLink>
                <NuxtLink v-for="c in data.categories" :key="c.slug" :to="`/guides?category=${c.slug}`" :class="{ on: category === c.slug }">{{ c.name }}</NuxtLink>
            </nav>
        </section>

        <section class="mk-wrap list">
            <p v-if="!data?.guides.length" class="none">No guides yet. Check back soon.</p>
            <ul v-else class="grid">
                <li v-for="g in data.guides" :key="g.slug">
                    <NuxtLink :to="`/guides/${g.slug}`">
                        <span class="cover">
                            <img v-if="g.coverImage" :src="g.coverImage" alt="" loading="lazy" width="800" height="450">
                            <span v-else class="ph" aria-hidden="true"><BrandMark :size="20" /><span>{{ g.category?.name ?? 'Guide' }}</span></span>
                        </span>
                        <span class="meta">
                            <span v-if="g.category" class="cat">{{ g.category.name }}</span>
                            <b>{{ g.title }}</b>
                            <span class="sum">{{ g.summary }}</span>
                            <time :datetime="g.publishedAt">{{ when(g.publishedAt) }}</time>
                        </span>
                    </NuxtLink>
                </li>
            </ul>
        </section>
        <MkCta />
    </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; padding-top: 64px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 36em; }
.cats { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
.cats a { border-radius: 999px; box-shadow: inset 0 0 0 1px var(--line); color: var(--quarry); font-size: 15px; font-weight: 600; padding: 8px 16px; text-decoration: none; }
.cats a:hover { box-shadow: inset 0 0 0 1px var(--quarry); }
.cats a.on { background: var(--quarry); box-shadow: none; color: var(--white); }
.list { padding-bottom: 88px; }
.none { color: var(--text-muted); font-size: 18px; }
.grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); list-style: none; margin: 0; padding: 0; }
.grid a { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); color: inherit; display: flex; flex-direction: column; height: 100%; overflow: hidden; text-decoration: none; }
.grid a:hover { box-shadow: 0 0 0 1px var(--quarry), 4px 4px 0 var(--lichen); }
.cover { aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--mist), #d4d8df); display: block; }
.cover img { display: block; height: 100%; object-fit: cover; width: 100%; }
.ph { background: linear-gradient(transparent calc(100% - 9px), #5b5773 calc(100% - 9px) calc(100% - 6px), #8c93a3 calc(100% - 6px) calc(100% - 3px), #c3c8d1 calc(100% - 3px)), var(--quarry); box-sizing: border-box; display: flex; flex-direction: column; height: 100%; justify-content: space-between; padding: 22px 24px 30px; }
.ph :deep(.brand) { color: var(--white); }
.ph > span:last-child { color: var(--lichen); font-size: 26px; font-weight: 900; letter-spacing: -.03em; }
.meta { display: flex; flex-direction: column; gap: 8px; padding: 20px 22px 24px; }
.cat { color: var(--heather); font-size: 13px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.meta b { font-size: 20px; letter-spacing: -.01em; line-height: 1.25; }
.sum { color: var(--text-body); font-size: 15.5px; line-height: 1.55; }
time { color: var(--text-muted); font-size: 14px; margin-top: auto; }
</style>
