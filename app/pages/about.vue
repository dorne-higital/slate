<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const page = useMarketingSeo('/about', {
    jsonLd: [{ '@context': 'https://schema.org', '@type': 'AboutPage', 'name': 'About Slate', 'url': `${MARKETING_SITE}/about` }]
})
const beliefs = [
    { icon: 'heart', title: 'Small businesses deserve good websites', text: 'Not a template that looks like everyone else’s, and not a bill for thousands. A site that brings in work and that you can change yourself.' },
    { icon: 'shield', title: 'Fewer things to go wrong', text: 'No plugins, no updates, no hosting to manage. The fewer moving parts, the fewer evenings lost to fixing them.' },
    { icon: 'chat', title: 'Plain words', text: 'Everything in Slate, from buttons to error messages, is written so you know what it means and what to do next.' },
    { icon: 'lock', title: 'Your data, looked after', text: 'Pages, posts and form replies stored in London, every site kept separate, and everything yours to download.' }
]
</script>

<template>
    <div>
        <section class="mk-wrap top">
            <p class="eyebrow">About</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">Slate is built and run in {{ LEGAL.location.split(',')[0] }} by {{ LEGAL.owner }}, a web developer who spent years building websites for small businesses, then watching them struggle to keep those sites up to date.</p>
        </section>
        <section class="mk-wrap story">
            <p>Most small business owners I’ve worked with had the same problem. Their website was built by someone else, on a system they didn’t understand, and every small change meant an email, a wait and often a bill. Or they used a big website builder, and spent their evenings fighting a drag-and-drop editor that let them break the layout in a hundred ways.</p>
            <p>Slate is my answer to that. It gives you ready-made blocks that always look right together, your own domain and email forwarding, forms with an inbox, and a health check that tells you exactly what to fix to get found on Google. Everything a small business website needs, and nothing that needs looking after.</p>
            <p>It’s deliberately a small, focused product. If you need a huge online shop or a custom web app, there are better tools. If you need a good website you can run yourself, that’s what Slate is for.</p>
            <p class="sign">{{ LEGAL.owner }}, founder</p>
        </section>
        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>What Slate stands for</h2></div>
                <MkFeatureGrid :items="beliefs" :columns="2" />
            </div>
        </section>
        <MkCta title="Try it for yourself." />
    </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 18px; max-width: 900px; padding-bottom: 24px; padding-top: 64px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; }
.lead { color: var(--text-body); font-size: 21px; line-height: 1.55; margin: 0; }
.story { display: flex; flex-direction: column; gap: 18px; max-width: 900px; padding-bottom: 72px; }
.story p { color: var(--text-body); font-size: 18.5px; line-height: 1.7; margin: 0; max-width: 40em; }
.story .sign { color: var(--quarry); font-weight: 700; }
</style>
