<script setup lang="ts">
// One feature page: hero with its video, alternating sections, an optional grid, FAQ and a call to action.
export interface FeatureSection { eyebrow?: string, title: string, text: string, points?: string[], video?: string, videoCaption?: string }
const props = defineProps<{
    path: string
    eyebrow: string
    lead: string
    video: string
    videoCaption: string
    sections: FeatureSection[]
    grid?: { title: string, text?: string, items: { icon: string, title: string, text: string, to?: string }[] }
    faqs?: FaqItem[]
}>()
const page = useMarketingSeo(props.path, { jsonLd: props.faqs?.length ? [faqJsonLd(props.faqs)] : [] })
const others = marketingSections('features').filter(p => p.path !== props.path && p.path !== '/features')
</script>

<template>
    <div>
        <MkHero :eyebrow="eyebrow" :title="page.h1" :lead="lead" :video="video" :video-caption="videoCaption" :secondary="{ label: 'See pricing', to: '/pricing' }" />

        <div class="sections">
            <MkSplit v-for="(s, i) in sections" :key="s.title" v-bind="s" :flip="i % 2 === 1" />
        </div>

        <section v-if="grid" class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head">
                    <h2>{{ grid.title }}</h2>
                    <p v-if="grid.text">{{ grid.text }}</p>
                </div>
                <MkFeatureGrid :items="grid.items" />
            </div>
        </section>

        <slot />

        <MkFaq v-if="faqs?.length" :items="faqs" />

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>More of what’s included</h2></div>
                <ul class="others">
                    <li v-for="o in others" :key="o.path"><NuxtLink :to="o.path"><b>{{ o.navLabel }}</b><span>{{ o.h1 }}</span></NuxtLink></li>
                </ul>
            </div>
        </section>
        <MkCta />
    </div>
</template>

<style scoped>
.sections > :nth-child(even) { background: var(--white); }
.others { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); list-style: none; margin: 0; padding: 0; }
.others a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 18px 20px; text-decoration: none; }
.others a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.others b { font-size: 17px; }
.others span { color: var(--text-body); font-size: 14.5px; }
</style>
