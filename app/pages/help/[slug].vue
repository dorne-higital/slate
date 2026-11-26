<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const route = useRoute()
const slug = String(route.params.slug)
const { data, error } = await useFetch(`/api/help/${slug}`)
if (error.value?.statusCode === 404) throw createError({ statusCode: 404, statusMessage: 'Help article not found', fatal: true })
if (error.value) throw createError({ statusCode: 500, statusMessage: 'Couldn’t load this article. Please try again.', fatal: true })
const a = computed(() => data.value!.article)
useMarketingSeo(`/help/${slug}`, {
    title: `${a.value.title} | Slate help`.length <= 60 ? `${a.value.title} | Slate help` : a.value.title,
    description: a.value.summary,
    image: '/og/help.png',
    jsonLd: [{
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        'name': a.value.title,
        'description': a.value.summary,
        'step': a.value.steps.map((text, i) => ({ '@type': 'HowToStep', 'position': i + 1, text }))
    }]
})
const { comingSoon } = useRuntimeConfig().public
const { me } = useMe()
const plain = computed(() => !!comingSoon && !me.value?.isPlatformAdmin)
const support = computed(() => me.value?.sites[0] ? `/sites/${me.value.sites[0].id}/support` : '/contact')
</script>

<template>
    <div v-if="data">
        <MkPlainHeader v-if="plain" />
        <div class="mk-wrap wrap">
            <nav class="crumbs" aria-label="Breadcrumb"><NuxtLink to="/help">Help</NuxtLink> <span aria-hidden="true">›</span> <NuxtLink :to="`/help#${a.area}`">{{ a.areaName }}</NuxtLink></nav>
            <h1>{{ a.title }}</h1>
            <p class="lead">{{ a.summary }}</p>
            <!-- Our own Markdown from content/help, rendered at build time -->
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="doc" v-html="a.html" />

            <section v-if="data.related.length" class="related">
                <h2>Related</h2>
                <ul>
                    <li v-for="r in data.related" :key="r.slug"><NuxtLink :to="`/help/${r.slug}`"><b>{{ r.title }}</b><span>{{ r.summary }}</span></NuxtLink></li>
                </ul>
            </section>

            <aside class="stuck">
                <b>Still stuck?</b>
                <span>Ask us and a real person will reply, usually within a working day.</span>
                <NuxtLink class="btn btn-dark" :to="support">{{ me?.sites[0] ? 'Ask in Support' : 'Contact us' }}</NuxtLink>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 18px; max-width: 820px; padding-bottom: 88px; padding-top: 48px; }
.crumbs { font-size: 15px; font-weight: 600; }
.crumbs a { color: var(--heather); }
h1 { font-size: clamp(34px, 4.4vw, 48px); font-weight: 900; letter-spacing: -.04em; line-height: 1.05; margin: 0; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.5; margin: 0; }
.doc { color: var(--text-body); font-size: 17.5px; line-height: 1.7; }
.doc :deep(h2) { color: var(--text); font-size: 24px; letter-spacing: -.02em; margin: 32px 0 10px; }
.doc :deep(p) { margin: 0 0 16px; }
.doc :deep(ol) { counter-reset: step; list-style: none; margin: 8px 0 24px; padding: 0; }
.doc :deep(ol > li) { counter-increment: step; margin-bottom: 14px; padding-left: 46px; position: relative; }
.doc :deep(ol > li)::before { align-items: center; background: var(--quarry); border-radius: 50%; color: var(--lichen); content: counter(step); display: flex; font-size: 14px; font-weight: 800; height: 30px; justify-content: center; left: 0; position: absolute; top: 0; width: 30px; }
.doc :deep(ul) { margin: 0 0 16px; padding-left: 22px; }
.doc :deep(li) { margin-bottom: 6px; }
.doc :deep(strong) { color: var(--text); }
.doc :deep(a) { color: var(--heather); font-weight: 600; }
.doc :deep(img) { border-radius: 12px; box-shadow: 0 0 0 1px var(--line), 0 18px 40px -18px rgb(46 52 69 / 35%); display: block; height: auto; margin: 8px 0 24px; width: 100%; }
.doc :deep(code) { background: var(--mist); border-radius: 4px; font-size: .9em; padding: 1px 6px; }
.related h2 { font-size: 20px; margin: 16px 0 12px; }
.related ul { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); list-style: none; margin: 0; padding: 0; }
.related a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 16px 18px; text-decoration: none; }
.related a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.related span { color: var(--text-muted); font-size: 14px; }
.stuck { align-items: center; background: var(--mist); border-radius: 12px; display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 16px; padding: 22px 26px; }
.stuck b { font-size: 18px; }
.stuck span { color: var(--text-body); flex: 1; min-width: 200px; }
</style>
