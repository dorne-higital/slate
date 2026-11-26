<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const route = useRoute()
const r = rival(String(route.params.rival))
if (!r) throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
const page = useMarketingSeo(`/compare/${r.slug}`)
const others = marketingSections('compare').filter(p => p.path !== `/compare/${r.slug}`)
</script>

<template>
    <div v-if="r">
        <section class="top mk-wrap">
            <p class="eyebrow">Slate vs {{ r.name }}</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">{{ r.intro }}</p>
        </section>

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>Side by side</h2></div>
                <div class="scroll" tabindex="0" role="region" :aria-label="`Slate and ${r.name} compared`">
                    <table class="cmp">
                        <thead><tr><th scope="col"><span class="visually-hidden">Topic</span></th><th scope="col" class="us">Slate</th><th scope="col">{{ r.name }}</th></tr></thead>
                        <tbody>
                            <tr v-for="row in r.rows" :key="row.topic">
                                <th scope="row">{{ row.topic }}</th>
                                <td class="us">{{ row.slate }}</td>
                                <td>{{ row.rival }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p class="src">
                    {{ r.name }} facts checked on {{ r.checked }} from their own website:
                    <template v-for="(s, i) in r.sources" :key="s.url"><a :href="s.url" rel="nofollow noopener" target="_blank">{{ s.label }}</a><template v-if="i < r.sources.length - 1">, </template></template>.
                    Prices and features change, so check their site for the latest.
                </p>
            </div>
        </section>

        <section class="mk-section">
            <div class="mk-wrap fit">
                <div class="card us-card">
                    <h2>Slate is a good fit if</h2>
                    <ul><li v-for="f in r.fit.slate" :key="f">{{ f }}</li></ul>
                    <NuxtLink class="btn btn-lichen btn-xl" to="/signup">Start your free trial</NuxtLink>
                </div>
                <div class="card">
                    <h2>{{ r.name }} may suit you better if</h2>
                    <ul><li v-for="f in r.fit.rival" :key="f">{{ f }}</li></ul>
                </div>
            </div>
        </section>

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>Moving to Slate?</h2><p>Add redirects from your old page addresses so you keep your place on Google. Our guide walks through it step by step.</p></div>
                <ul class="others">
                    <li><NuxtLink to="/features/seo"><b>Redirects and SEO</b><span>Keep your place on Google when you move</span></NuxtLink></li>
                    <li v-for="o in others" :key="o.path"><NuxtLink :to="o.path"><b>{{ o.navLabel }}</b><span>{{ o.h1 }}</span></NuxtLink></li>
                </ul>
            </div>
        </section>
        <MkCta />
    </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 18px; padding-bottom: 64px; padding-top: 64px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; max-width: 14em; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 38em; }
.scroll { overflow-x: auto; }
.cmp { background: var(--white); border-collapse: collapse; border-radius: 10px; box-shadow: 0 0 0 1px var(--line); min-width: 640px; width: 100%; }
.cmp th, .cmp td { border-bottom: 1px solid var(--line-soft); font-size: 15.5px; line-height: 1.5; padding: 16px 18px; text-align: left; vertical-align: top; width: 41%; }
.cmp th[scope='row'] { color: var(--text-muted); font-weight: 600; }
.cmp tr > :first-child { width: 18%; }
.cmp thead th { border-bottom: 2px solid var(--quarry); font-size: 18px; }
.cmp .us { background: #fff6e6; }
.src { color: var(--text-muted); font-size: 14px; line-height: 1.6; margin: 16px 0 0; }
.src a { color: var(--heather); }
.fit { display: grid; gap: 24px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); display: flex; flex-direction: column; gap: 16px; padding: 28px; }
.us-card { box-shadow: 0 0 0 2px var(--quarry), 5px 5px 0 var(--lichen); }
.card h2 { font-size: 26px; letter-spacing: -.02em; margin: 0; }
.card ul { display: flex; flex-direction: column; gap: 10px; margin: 0; padding-left: 20px; }
.card li { color: var(--text-body); font-size: 16px; line-height: 1.5; }
.card .btn { align-self: flex-start; margin-top: 8px; }
.others { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); list-style: none; margin: 0; padding: 0; }
.others a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); box-sizing: border-box; color: inherit; display: flex; flex-direction: column; gap: 4px; height: 100%; padding: 18px 20px; text-decoration: none; }
.others a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.others b { font-size: 17px; }
.others span { color: var(--text-body); font-size: 14.5px; }
@media (max-width: 760px) { .fit { grid-template-columns: minmax(0, 1fr); } }
</style>
