<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const faqs: FaqItem[] = [
    { q: 'My business isn’t on the list. Can I still use Slate?', a: 'Yes. Start from the blank layout, or from whichever one is closest, and rename or remove pages as you like. Every block works for every kind of business.' },
    { q: 'Can I change layout later?', a: 'The layout is just a starting point: a set of pages with blocks already in place. You can add, remove and rename pages at any time.' },
    { q: 'Do the layouts look the same for everyone?', a: 'No. Your colours, fonts, logo and pictures change the whole look, and you choose which blocks to keep.' }
]
const page = useMarketingSeo('/websites-for', { jsonLd: [faqJsonLd(faqs)] })
const cards = SECTORS.map(s => ({
    ...s,
    page: marketingPage(`/websites-for/${s.slug}`),
    pages: s.sections.map(x => x.page),
    points: s.features.slice(0, 3).map(f => f.title)
}))
</script>

<template>
    <div>
        <section class="top mk-wrap">
            <p class="eyebrow">Who it’s for</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">Pick the starting layout for your business when you sign up: the pages people expect, with the right blocks already in place. Then make it yours.</p>
        </section>

        <section class="mk-wrap list">
            <ul class="cards">
                <li v-for="c in cards" :key="c.slug">
                    <NuxtLink :to="c.page.path" class="card">
                        <span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(c.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                        <h2>{{ c.page.navLabel }}</h2>
                        <p class="who">{{ c.eyebrow.replace(/^For (.)/, (_m, l: string) => l.toUpperCase()) }}</p>
                        <ul class="points">
                            <li v-for="p in c.points" :key="p">{{ p }}</li>
                        </ul>
                        <p class="pages"><b>Pages ready to fill in:</b> {{ c.pages.join(', ') }}</p>
                        <span class="go">Websites for {{ c.page.navLabel!.toLowerCase() }} <span aria-hidden="true">→</span></span>
                    </NuxtLink>
                </li>
                <li>
                    <NuxtLink to="/signup" class="card other">
                        <span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon('star')" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                        <h2>Something else?</h2>
                        <p class="who">Every block works for every kind of business</p>
                        <ul class="points">
                            <li>Start blank, or from the closest layout</li>
                            <li>Add, rename and remove pages freely</li>
                            <li>Your colours, fonts and pictures throughout</li>
                        </ul>
                        <span class="go">Start your free trial <span aria-hidden="true">→</span></span>
                    </NuxtLink>
                </li>
            </ul>
        </section>

        <MkFaq :items="faqs" />
        <MkCta />
    </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; padding-top: 64px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; max-width: 14em; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 36em; }
.list { padding-bottom: 72px; }
.cards { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); list-style: none; margin: 0; padding: 0; }
.card { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 10px; height: 100%; padding: 26px; text-decoration: none; transition: box-shadow .15s, transform .15s; }
.card:hover { box-shadow: 0 0 0 1px var(--quarry), 4px 4px 0 var(--lichen); transform: translate(-2px, -2px); }
.ic { align-items: center; background: var(--mist); border-radius: 10px; color: var(--heather); display: flex; height: 46px; justify-content: center; width: 46px; }
.card:hover .ic { background: var(--quarry); color: var(--lichen); }
h2 { font-size: 24px; letter-spacing: -.02em; margin: 6px 0 0; }
.who { color: var(--text-muted); font-size: 15px; margin: 0; }
.points { display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 8px 0 4px; padding: 0; }
.points li { color: var(--text-body); font-size: 15.5px; padding-left: 26px; position: relative; }
.points li::before { border-bottom: 2px solid var(--ok); border-left: 2px solid var(--ok); content: ''; height: 5px; left: 3px; position: absolute; top: 6px; transform: rotate(-45deg); width: 10px; }
.pages { border-top: 1px solid var(--line-soft); color: var(--text-body); font-size: 14px; line-height: 1.5; margin: 4px 0 0; padding-top: 12px; }
.go { color: var(--heather); font-weight: 700; margin-top: auto; padding-top: 6px; }
.other { background: var(--paper); box-shadow: inset 0 0 0 1.5px var(--line); }
@media (prefers-reduced-motion: reduce) { .card { transition: none; } .card:hover { transform: none; } }
</style>
