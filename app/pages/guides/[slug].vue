<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const route = useRoute()
const slug = String(route.params.slug)
const { data, error } = await useFetch(`/api/marketing/guides/${slug}`)
if (error.value) {
    type Moved = { redirect?: { to: string, permanent: boolean }, data?: { redirect?: { to: string, permanent: boolean } } }
    const moved = (error.value.data as Moved)?.redirect ?? (error.value.data as Moved)?.data?.redirect
    if (moved) await navigateTo(moved.to, { redirectCode: moved.permanent ? 301 : 302, external: /^https?:\/\//i.test(moved.to) })
    else throw createError({ statusCode: 404, statusMessage: 'Guide not found', fatal: true })
}
const post = computed(() => data.value!.post)
const url = `${MARKETING_SITE}/guides/${slug}`
useMarketingSeo(`/guides/${slug}`, {
    title: `${post.value.title} | Slate guides`.length <= 60 ? `${post.value.title} | Slate guides` : post.value.title,
    description: post.value.summary,
    image: post.value.coverImage ?? undefined,
    jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.value.title,
        'description': post.value.summary,
        'datePublished': post.value.publishedAt,
        'dateModified': post.value.updatedAt,
        'author': { '@type': 'Person', 'name': post.value.author },
        'publisher': { '@type': 'Organization', 'name': 'Slate', 'url': MARKETING_SITE },
        'mainEntityOfPage': url,
        ...(post.value.coverImage ? { image: post.value.coverImage } : {})
    }]
})
const parts = computed(() => parsePostBody(post.value.body))
const when = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
</script>

<template>
    <article v-if="data">
        <header class="head mk-wrap">
            <p class="crumbs"><NuxtLink to="/guides">Guides</NuxtLink><template v-if="post.category"> · <NuxtLink :to="`/guides?category=${post.category.slug}`">{{ post.category.name }}</NuxtLink></template></p>
            <h1>{{ post.title }}</h1>
            <p class="lead">{{ post.summary }}</p>
            <p class="by">By {{ post.author }} · <time :datetime="post.publishedAt">{{ when(post.publishedAt) }}</time> · {{ post.minutes }} min read</p>
        </header>
        <div v-if="post.coverImage" class="mk-wrap cover"><img :src="post.coverImage" alt="" width="1200" height="630" fetchpriority="high"></div>
        <div class="mk-wrap body">
            <template v-for="(part, i) in parts" :key="i">
                <h2 v-if="part.kind === 'h'">{{ part.text }}</h2>
                <ul v-else-if="part.kind === 'ul'"><li v-for="(item, j) in part.items" :key="j">{{ item }}</li></ul>
                <p v-else>{{ part.text }}</p>
            </template>
            <aside class="try">
                <b>Make your website with Slate</b>
                <span>Ready-made blocks, your own domain, forms and a site health check, from {{ formatPence(Math.min(...PLANS.map(p => p.monthly))) }} a month. {{ TRIAL_DAYS }} days free, no card needed.</span>
                <NuxtLink class="btn btn-lichen" to="/signup">Start your free trial</NuxtLink>
            </aside>
        </div>
        <section v-if="data.more.length" class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>More guides</h2></div>
                <ul class="more">
                    <li v-for="g in data.more" :key="g.slug"><NuxtLink :to="`/guides/${g.slug}`"><b>{{ g.title }}</b><span>{{ g.summary }}</span></NuxtLink></li>
                </ul>
            </div>
        </section>
    </article>
</template>

<style scoped>
.head { display: flex; flex-direction: column; gap: 16px; max-width: 820px; padding-bottom: 32px; padding-top: 56px; }
.crumbs { font-size: 15px; font-weight: 600; margin: 0; }
.crumbs a { color: var(--heather); }
h1 { font-size: clamp(36px, 4.6vw, 54px); font-weight: 900; letter-spacing: -.04em; line-height: 1.04; margin: 0; }
.lead { color: var(--text-body); font-size: 21px; line-height: 1.5; margin: 0; }
.by { color: var(--text-muted); font-size: 15px; margin: 0; }
.cover { max-width: 1000px; }
.cover img { border-radius: 12px; display: block; height: auto; width: 100%; }
.body { display: flex; flex-direction: column; font-size: 18.5px; gap: 20px; line-height: 1.72; max-width: 820px; padding-bottom: 72px; padding-top: 40px; }
.body h2 { font-size: 28px; letter-spacing: -.02em; line-height: 1.2; margin: 20px 0 0; }
.body p { color: var(--text-body); margin: 0; white-space: pre-line; }
.body ul { color: var(--text-body); display: flex; flex-direction: column; gap: 8px; margin: 0; padding-left: 24px; }
.try { background: var(--quarry); border-radius: 12px; color: #c3c8d1; display: flex; flex-direction: column; font-size: 16px; gap: 10px; margin-top: 24px; padding: 24px 26px; }
.try b { color: var(--white); font-size: 20px; }
.try .btn { align-self: flex-start; margin-top: 6px; }
.more { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); list-style: none; margin: 0; padding: 0; }
.more a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 6px; height: 100%; padding: 20px 22px; text-decoration: none; }
.more a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.more b { font-size: 18px; }
.more span { color: var(--text-body); font-size: 15px; }
</style>
