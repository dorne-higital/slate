<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const route = useRoute()
const s = sector(String(route.params.sector))
if (!s) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const path = `/for/${s.slug}`
const page = useMarketingSeo(path, { jsonLd: [faqJsonLd(s.faq)] })
const layout = findStarterLayout(s.layoutId)
const others = marketingSections('for').filter(p => p.path !== path)
</script>

<template>
    <div v-if="s">
        <MkHero :eyebrow="s.eyebrow" :title="page.h1" :lead="s.lead" video="tour" video-caption="From sign-up to a live website (sped up)." :secondary="{ label: 'See pricing', to: '/pricing' }" />

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>Sound familiar?</h2></div>
                <ul class="problems">
                    <li v-for="p in s.problems" :key="p.title"><h3>{{ p.title }}</h3><p>{{ p.text }}</p></li>
                </ul>
            </div>
        </section>

        <section class="mk-section">
            <div class="mk-wrap layout">
                <div class="mk-head">
                    <p class="eyebrow">Your starting layout</p>
                    <h2>Start with “{{ layout.name }}”</h2>
                    <p>Pick this layout when you sign up and these pages are ready for your words and pictures. Add, remove or rename any of them.</p>
                </div>
                <ol class="pages">
                    <li v-for="(p, i) in s.sections" :key="p.page">
                        <span class="n">{{ i + 1 }}</span>
                        <span><b>{{ p.page }}</b><span>{{ p.text }}</span></span>
                    </li>
                </ol>
            </div>
        </section>

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>What helps most</h2></div>
                <MkFeatureGrid :items="s.features" />
            </div>
        </section>

        <MkFaq :items="s.faq" />

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>Also made for</h2></div>
                <ul class="others">
                    <li v-for="o in others" :key="o.path"><NuxtLink :to="o.path"><b>{{ o.navLabel }}</b><span>{{ o.h1 }}</span></NuxtLink></li>
                </ul>
            </div>
        </section>
        <MkCta />
    </div>
</template>

<style scoped>
.eyebrow { color: var(--heather) !important; font-size: 14px !important; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.problems { display: grid; gap: 20px; grid-template-columns: repeat(3, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
.problems li { border-top: 3px solid var(--quarry); padding-top: 18px; }
.problems h3 { font-size: 19px; margin: 0 0 8px; }
.problems p { color: var(--text-body); font-size: 16px; line-height: 1.6; margin: 0; }
.layout { display: grid; gap: 48px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); }
.layout .mk-head { margin: 0; }
.pages { display: flex; flex-direction: column; gap: 10px; list-style: none; margin: 0; padding: 0; }
.pages li { align-items: flex-start; background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 3px 3px 0 var(--mist); display: flex; gap: 16px; padding: 16px 18px; }
.n { align-items: center; background: var(--quarry); border-radius: 50%; color: var(--lichen); display: flex; flex: none; font-size: 14px; font-weight: 800; height: 30px; justify-content: center; width: 30px; }
.pages b { display: block; font-size: 16.5px; }
.pages li span span { color: var(--text-body); font-size: 15px; }
.others { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); list-style: none; margin: 0; padding: 0; }
.others a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 18px 20px; text-decoration: none; }
.others a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.others b { font-size: 17px; }
.others span { color: var(--text-body); font-size: 14.5px; }
@media (max-width: 960px) { .problems, .layout { grid-template-columns: minmax(0, 1fr); } }
</style>
