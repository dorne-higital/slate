<script setup lang="ts">
useHead({
    title: 'Slate: build your website, run it from one place',
    meta: [{ name: 'description', content: 'Slate gives you a page editor, forms, a blog and hosting in one account. Start from a layout, change anything by moving blocks around, and publish to your own domain.' }]
})
const { me, ensure } = useMe()
await ensure()
const dashboard = computed(() => me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/signup')
const { sitesDomain } = useRuntimeConfig().public
const freeDomain = sitesDomain.includes('localhost') ? 'slatecms.co.uk' : sitesDomain

const steps = [
    { title: 'Create your account', text: `Choose a name for your site. You get a free ${freeDomain} address straight away.` },
    { title: 'Pick a starting layout', text: 'Start with pages already in place for a trade, a shop, a studio or a practice, or start blank.' },
    { title: 'Make it yours', text: 'Add blocks, put them in order and type into them. Set your colours and fonts once.' },
    { title: 'Connect your domain and publish', text: 'Point your own domain at Slate. We set up the secure certificate for you.' }
]

const included = [
    { name: 'Pages', text: 'Build pages from blocks and nest them under each other.' },
    { name: 'Menus', text: 'Choose what appears in your header and footer.' },
    { name: 'Forms', text: 'Contact and quote forms, with every reply kept in an inbox.' },
    { name: 'Blog', text: 'Write posts, schedule them and sort them into categories.' },
    { name: 'Media', text: 'Upload images and files once, use them on any page.' },
    { name: 'Theme', text: 'Set your logo, colours and fonts for the whole site.' },
    { name: 'Search and sharing', text: 'See which pages are missing titles, descriptions or share images.' },
    { name: 'Domains', text: 'Connect your own domain with step-by-step instructions.' },
    { name: 'Integrations', text: 'Add analytics, booking tools and email sign-ups.' },
    { name: 'Hosting', text: 'Served from Cloudflare’s network, with HTTPS on every domain.' }
]

// Example sites for illustration on the "for studios" card
const exampleSites = [
    { name: 'Bramble & Oak Upholstery', domain: 'brambleandoak.co.uk', initial: 'B', color: '#2F5D50', live: true },
    { name: 'Fenwick Physiotherapy', domain: 'fenwickphysio.co.uk', initial: 'F', color: '#3B5BA5', live: true },
    { name: 'Tidewater Bikes', domain: `tidewater.${freeDomain}`, initial: 'T', color: '#9A4A2E', live: false },
    { name: 'Marlow Street Bakery', domain: 'marlowstreet.co.uk', initial: 'M', color: '#6B4C8A', live: true }
]

// Prices still to be decided: replace [PRICE] and [N] here.
const plans = [
    { name: 'Starter', tagline: 'For a simple site', price: '[PRICE]', highlight: false },
    { name: 'Business', tagline: 'Most small businesses pick this', price: '[PRICE]', highlight: true },
    { name: 'Studio', tagline: 'For designers and agencies', price: '[PRICE]', highlight: false }
]
const planRows = [
    { label: 'Websites', values: ['1', '1', 'Up to [N]'] },
    { label: 'Pages', values: ['Up to [N]', 'Unlimited', 'Unlimited'] },
    { label: 'Your own domain', values: ['Yes', 'Yes', 'Yes, on every site'] },
    { label: 'Forms and replies inbox', values: ['1 form', 'Unlimited', 'Unlimited'] },
    { label: 'Blog', values: ['No', 'Yes', 'Yes'] },
    { label: 'Integrations', values: ['Analytics only', 'All', 'All'] },
    { label: 'People who can edit', values: ['1', 'Up to [N]', 'Unlimited, with client roles'] }
]

const faqs = [
    { q: 'Do I need to know how to code?', a: 'No. You build pages by adding blocks and typing into them. If you want something custom, a developer can build a new block that appears in your editor.' },
    { q: 'Can I use a domain I already own?', a: 'Yes. Keep it wherever you bought it. Slate shows you the two records to add, then checks them and sets up HTTPS for you.' },
    { q: 'What happens to my site if I cancel?', a: 'Your site goes offline at the end of your billing period. You can download your pages, posts, images and form replies before then.' },
    { q: 'Where is my data stored?', a: '[CONFIRM DATA REGION]. Every site’s content is kept separate, and every request is checked, so one account can never see another’s.' }
]

const sheets = [
    { tag: 'Footer', kind: 'footer' },
    { tag: 'Contact form', kind: 'form' },
    { tag: 'Services', kind: 'services' },
    { tag: 'Hero (editing)', kind: 'hero' },
    { tag: 'Header', kind: 'header' }
]
</script>

<template>
    <div class="mk">
        <header class="top">
            <div class="wrap bar">
                <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>
                <nav class="nav-links" aria-label="Main">
                    <a class="nav-link" href="#how">How it works</a>
                    <a class="nav-link" href="#included">What’s included</a>
                    <a class="nav-link" href="#studios">For studios</a>
                    <a class="nav-link" href="#pricing">Pricing</a>
                </nav>
                <div class="actions">
                    <NuxtLink v-if="me" class="btn btn-dark" :to="dashboard">Go to your site</NuxtLink>
                    <template v-else>
                        <NuxtLink class="nav-link" to="/login">Log in</NuxtLink>
                        <NuxtLink class="btn btn-dark" to="/signup">Start your site</NuxtLink>
                    </template>
                </div>
            </div>
        </header>

        <main id="top">
            <section class="wrap hero">
                <div class="copy">
                    <h1>Build your website. Run it from one place.</h1>
                    <p class="lead">Slate gives you a page editor, forms, a blog and hosting in one account. Start from a layout, change anything by moving blocks around, and publish to your own domain.</p>
                    <div class="ctas">
                        <NuxtLink class="btn btn-lichen btn-xl" to="/signup">Start your site</NuxtLink>
                        <a class="btn btn-outline btn-xl" href="#how">See how it works</a>
                    </div>
                    <p class="small">Free to start. No card needed.</p>
                </div>

                <div class="stack-wrap" role="img" aria-label="A website broken into its blocks: header, hero, services, contact form and footer">
                    <div class="stack">
                        <div v-for="(s, i) in sheets" :key="s.kind" class="sheet3" :class="[`s-${s.kind}`, { picked: s.kind === 'hero' }]" :style="{ '--i': i }">
                            <span class="sheet-tag">{{ s.tag }}</span>
                            <template v-if="s.kind === 'footer'">
                                <div class="f-cols"><div><i class="w70" /><i class="w50 dim" /><i class="w58 dim" /></div><div><i class="w60" /><i class="w44 dim" /></div></div>
                                <span class="f-copy">© Bramble &amp; Oak Upholstery</span>
                            </template>
                            <template v-else-if="s.kind === 'form'">
                                <b>Get a quote</b><i class="inp1" /><i class="inp1" /><i class="inp2" /><i class="sub" />
                            </template>
                            <template v-else-if="s.kind === 'services'">
                                <b>What we do</b><div class="tiles"><i /><i /><i /></div>
                            </template>
                            <template v-else-if="s.kind === 'hero'">
                                <b class="big">Chairs and sofas, reupholstered by hand</b><i class="sub wide" />
                            </template>
                            <template v-else>
                                <b>Bramble &amp; Oak</b><div class="dots"><i /><i /><i class="on" /></div>
                            </template>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how" class="how">
                <div class="wrap col">
                    <div class="intro">
                        <h2>From sign-up to live site in an afternoon</h2>
                        <p>You don’t need to write code or hire anyone. If you can edit a document, you can build a page.</p>
                    </div>
                    <ol class="steps">
                        <li v-for="(s, i) in steps" :key="s.title"><span class="num">{{ i + 1 }}</span><b>{{ s.title }}</b><span>{{ s.text }}</span></li>
                    </ol>
                </div>
            </section>

            <div class="strata" aria-hidden="true" />

            <section id="included" class="included">
                <div class="wrap split2">
                    <div class="intro">
                        <h2>Everything your site needs is already in the box</h2>
                        <p>No plugins to install and nothing to keep updated. These are the sections you’ll find in your Slate dashboard.</p>
                        <NuxtLink class="btn btn-lichen btn-xl self-start" to="/signup">Start your site</NuxtLink>
                    </div>
                    <dl class="incl">
                        <div v-for="x in included" :key="x.name"><dt>{{ x.name }}</dt><dd>{{ x.text }}</dd></div>
                    </dl>
                </div>
            </section>

            <section id="studios" class="studios">
                <div class="wrap split2">
                    <div class="intro">
                        <h2>Building sites for clients?</h2>
                        <p>Run every client site from one login. Build the pages yourself, then invite your client to edit only what you allow, such as their blog and opening hours, without the risk of breaking the layout.</p>
                        <ul class="ticks">
                            <li>Owner, editor and client roles on each site</li>
                            <li>Build a block once and use it on every site</li>
                            <li>Billing and domains stay with you, not your client</li>
                        </ul>
                    </div>
                    <div class="sites-card" aria-label="Example: a studio’s list of client sites">
                        <div class="sites-head">Your sites</div>
                        <div v-for="s in exampleSites" :key="s.name" class="site-row">
                            <span class="badge" :style="{ background: s.color }" aria-hidden="true">{{ s.initial }}</span>
                            <span class="site-text"><b>{{ s.name }}</b><span>{{ s.domain }}</span></span>
                            <span class="state" :class="s.live ? 'live' : 'wip'">{{ s.live ? 'Live' : 'In progress' }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" class="pricing">
                <div class="wrap col">
                    <div class="intro">
                        <h2>Pricing</h2>
                        <p>Every plan includes hosting, HTTPS and the full editor. Prices exclude VAT. Cancel from your dashboard at any time.</p>
                    </div>
                    <div class="scroll">
                        <table class="price">
                            <caption class="visually-hidden">Plan comparison</caption>
                            <thead>
                                <tr>
                                    <th scope="col"><span class="visually-hidden">Feature</span></th>
                                    <th v-for="p in plans" :key="p.name" scope="col" :class="{ hl: p.highlight }">
                                        <span class="plan">
                                            <b>{{ p.name }}</b>
                                            <span class="muted">{{ p.tagline }}</span>
                                            <span class="amount">£{{ p.price }}<span> a month</span></span>
                                            <NuxtLink class="btn" :class="p.highlight ? 'btn-lichen' : 'btn-outline'" to="/signup">Choose {{ p.name }}</NuxtLink>
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in planRows" :key="r.label">
                                    <td>{{ r.label }}</td>
                                    <td v-for="(v, i) in r.values" :key="i" :class="{ hl: plans[i]?.highlight }">{{ v }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section class="faq">
                <div class="wrap split2 top-align">
                    <h2>Questions people ask before signing up</h2>
                    <div>
                        <details v-for="(f, i) in faqs" :key="f.q" :open="i === 0">
                            <summary>{{ f.q }}<span class="pm" aria-hidden="true">+</span></summary>
                            <p>{{ f.a }}</p>
                        </details>
                    </div>
                </div>
            </section>
        </main>

        <div class="strata" aria-hidden="true" />

        <footer class="foot">
            <div class="wrap col">
                <div class="foot-cta">
                    <h2>Start with a blank slate.</h2>
                    <NuxtLink class="btn btn-lichen btn-xl" to="/signup">Start your site</NuxtLink>
                </div>
                <div class="foot-grid">
                    <div class="foot-brand">
                        <span class="foot-logo">slate</span>
                        <span>Made in the UK.</span>
                    </div>
                    <nav aria-label="Product"><a class="foot-link" href="#how">How it works</a><a class="foot-link" href="#included">Features</a><a class="foot-link" href="#pricing">Pricing</a><a class="foot-link" href="#studios">For studios</a></nav>
                    <nav aria-label="Account"><NuxtLink class="foot-link" to="/login">Log in</NuxtLink><NuxtLink class="foot-link" to="/signup">Sign up</NuxtLink></nav>
                </div>
            </div>
        </footer>
    </div>
</template>

<style scoped>
.mk { background: var(--paper); }
.wrap { margin: 0 auto; max-width: 1200px; padding: 0 40px; }
.col { display: flex; flex-direction: column; gap: 56px; }
h2 { font-size: 48px; font-weight: 800; letter-spacing: -.035em; line-height: 1.04; margin: 0; }
.intro { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
.intro p { color: var(--text-body); font-size: 18px; line-height: 1.6; margin: 0; }
.self-start { align-self: flex-start; }
.btn-xl { font-size: 17px; min-height: 56px; padding: 0 28px; }
.btn-outline { background: transparent; box-shadow: inset 0 0 0 1.5px var(--quarry); color: var(--quarry); }
.btn-outline:hover { background: var(--quarry); color: var(--paper); }

.top { border-bottom: 1px solid var(--line-soft); }
.bar { align-items: center; display: flex; gap: 24px; justify-content: space-between; min-height: 76px; }
.home-link { text-decoration: none; }
.nav-links { display: flex; gap: 28px; }
.nav-link { color: var(--quarry); font-size: 15px; font-weight: 500; padding: 12px 4px; text-decoration: none; }
.nav-link:hover { color: var(--heather); text-decoration: underline; text-underline-offset: 4px; }
.actions { align-items: center; display: flex; gap: 14px; }

.hero { align-items: center; display: grid; gap: 40px; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); padding-bottom: 96px; padding-top: 72px; }
.copy { display: flex; flex-direction: column; gap: 28px; }
h1 { font-size: 72px; font-weight: 900; letter-spacing: -.045em; line-height: .98; margin: 0; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 31em; }
.ctas { display: flex; flex-wrap: wrap; gap: 14px; }
.small { color: var(--text-muted); font-size: 15px; margin: 0; }

/* The exploded stack of sheets: a site broken into its blocks */
.stack-wrap { align-items: center; display: flex; height: 560px; justify-content: center; perspective: 2400px; }
.stack { height: 240px; position: relative; transform: rotateX(58deg) rotateZ(-36deg); transform-style: preserve-3d; width: 360px; }
.sheet3 {
    animation: drop .9s cubic-bezier(.2, .8, .2, 1) both;
    animation-delay: calc(var(--i) * 110ms + 150ms);
    background: var(--white);
    border-radius: 4px;
    box-shadow: var(--sheet-edge), 10px 14px 24px rgb(46 52 69 / 18%);
    display: flex;
    flex-direction: column;
    gap: 10px;
    inset: 0;
    padding: 22px 24px;
    position: absolute;
    transform: translateZ(calc(var(--i) * 58px));
    transition: transform .45s cubic-bezier(.2, .8, .2, 1);
}
.stack-wrap:hover .sheet3 { transform: translateZ(calc(var(--i) * 84px)); }
.sheet3 b { color: #23302c; font-size: 17px; }
.sheet3 i { border-radius: 2px; display: block; }
.sheet-tag { color: var(--heather); font-size: 13px; font-weight: 600; left: 0; position: absolute; top: -30px; white-space: nowrap; }
.sheet3.picked { box-shadow: 0 0 0 3px var(--lichen), 4px 4px 0 3px var(--lichen-edge), 10px 14px 24px rgb(46 52 69 / 20%); }
.sheet3.picked .sheet-tag { color: var(--quarry); }
.s-footer { background: #23302c; justify-content: space-between; }
.f-cols { display: flex; gap: 24px; }
.f-cols div { display: flex; flex-direction: column; gap: 8px; }
.f-cols i { background: #6e8a80; height: 7px; }
.f-cols i.dim { background: #4a6158; }
.w70 { width: 70px; } .w50 { width: 50px; } .w58 { width: 58px; } .w60 { width: 60px; } .w44 { width: 44px; }
.f-copy { color: #9db3aa; font-size: 12px; }
.inp1 { border: 1.5px solid #c3c8d1; height: 30px; }
.inp2 { border: 1.5px solid #c3c8d1; height: 52px; }
.sub { background: #2f5d50; height: 30px; width: 96px; }
.sub.wide { height: 32px; width: 110px; }
.s-services { gap: 14px; }
.tiles { display: grid; flex: 1; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.tiles i { background: #e3ebe7; }
.s-hero { background: #f1ede4; gap: 12px; justify-content: center; padding: 26px 24px; }
.big { font-size: 26px !important; letter-spacing: -.02em; line-height: 1.05; }
.s-header { align-items: center; flex-direction: row; height: 54px; justify-content: space-between; padding: 0 24px; }
.s-header b { font-size: 15px; }
.dots { display: flex; gap: 10px; }
.dots i { background: #c3c8d1; height: 7px; width: 34px; }
.dots i.on { background: #2f5d50; }
@keyframes drop {
    from { opacity: 0; transform: translateZ(calc(var(--i) * 58px + 420px)); }
    to { opacity: 1; transform: translateZ(calc(var(--i) * 58px)); }
}
@media (prefers-reduced-motion: reduce) {
    .sheet3 { animation: none; transition: none; }
    .stack-wrap:hover .sheet3 { transform: translateZ(calc(var(--i) * 58px)); }
}

.how { background: var(--mist); padding: 96px 0; }
.steps { display: grid; gap: 32px; grid-template-columns: repeat(4, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
.steps li { border-top: 3px solid var(--quarry); display: flex; flex-direction: column; gap: 12px; padding-top: 20px; }
.steps .num { color: var(--heather); font-size: 40px; font-weight: 300; line-height: 1; }
.steps b { font-size: 20px; }
.steps span:last-child { color: var(--text-body); font-size: 16px; line-height: 1.55; }

.strata { background: linear-gradient(#5b5773 0 3px, #8c93a3 3px 6px, #c3c8d1 6px 9px); height: 9px; }

.split2 { align-items: center; display: grid; gap: 64px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.split2.top-align { align-items: start; }
.included { background: var(--quarry); color: var(--mist); padding: 104px 0; }
.included h2 { color: var(--white); }
.included .intro p { color: #c3c8d1; }
.incl { column-gap: 48px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; }
.incl div { border-top: 1px solid rgb(230 233 238 / 16%); padding: 20px 0; }
.incl dt { color: var(--white); font-size: 17px; font-weight: 700; }
.incl dd { color: #c3c8d1; font-size: 15px; line-height: 1.55; margin: 6px 0 0; }

.studios { padding: 104px 0; }
.ticks { display: flex; flex-direction: column; font-size: 16px; gap: 12px; list-style: none; margin: 0; padding: 0; }
.ticks li { padding-left: 34px; position: relative; }
.ticks li::before { border-bottom: 2.4px solid var(--heather); border-left: 2.4px solid var(--heather); content: ''; height: 6px; left: 5px; position: absolute; top: 5px; transform: rotate(-45deg); width: 12px; }
.sites-card { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px #d4d8df, 3px 3px 0 #c3c8d1, 6px 6px 0 #8c93a3; padding: 8px; }
.sites-head { color: var(--text-muted); font-size: 14px; font-weight: 600; padding: 14px 16px; }
.site-row { align-items: center; border-top: 1px solid var(--line-soft); display: flex; gap: 14px; padding: 14px 16px; }
.badge { align-items: center; border-radius: var(--radius); color: var(--white); display: flex; flex: none; font-size: 15px; font-weight: 800; height: 36px; justify-content: center; width: 36px; }
.site-text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.site-text b { font-size: 16px; }
.site-text span { color: var(--text-muted); font-size: 14px; }
.state { border-radius: 999px; font-size: 13px; font-weight: 600; padding: 4px 10px; }
.state.live { background: #e3ebe7; color: #1f4a3e; }
.state.wip { background: #fff1d6; color: var(--warn-text); }

.pricing { background: var(--mist); padding: 104px 0; }
.scroll { overflow-x: auto; }
.price { border-collapse: collapse; min-width: 760px; width: 100%; }
.price th, .price td { border-bottom: 1px solid #d4d8df; font-size: 15px; padding: 16px 20px; text-align: left; vertical-align: top; }
.price thead th { border-bottom: 2px solid var(--quarry); vertical-align: bottom; }
.price td:first-child { color: var(--text-muted); }
.price .hl { background: #fff6e6; }
.plan { display: flex; flex-direction: column; gap: 8px; }
.plan b { font-size: 22px; }
.amount { font-size: 32px; font-weight: 800; letter-spacing: -.02em; }
.amount span { color: var(--text-muted); font-size: 15px; font-weight: 500; letter-spacing: 0; }
.plan .btn { margin-top: 8px; }

.faq { padding: 104px 0; }
.faq h2 { max-width: 420px; }
details { border-top: 1px solid #d4d8df; }
details:last-child { border-bottom: 1px solid #d4d8df; }
summary { cursor: pointer; display: flex; font-size: 19px; font-weight: 700; gap: 24px; justify-content: space-between; list-style: none; padding: 22px 0; }
summary::-webkit-details-marker { display: none; }
.pm { flex: none; font-size: 24px; font-weight: 400; line-height: 1; transition: transform .2s; }
details[open] .pm { transform: rotate(45deg); }
details p { color: var(--text-body); font-size: 16px; line-height: 1.6; margin: 0 0 22px; max-width: 36em; }

.foot { background: var(--quarry); color: var(--mist); padding: 88px 0 48px; }
.foot-cta { align-items: flex-start; display: flex; flex-direction: column; gap: 28px; }
.foot-cta h2 { color: var(--white); font-size: 56px; font-weight: 900; letter-spacing: -.04em; line-height: 1; max-width: 640px; }
.foot-grid { border-top: 1px solid rgb(230 233 238 / 16%); display: grid; gap: 32px; grid-template-columns: 2fr 1fr 1fr; padding-top: 40px; }
.foot-brand { color: #c3c8d1; display: flex; flex-direction: column; font-size: 15px; gap: 8px; }
.foot-logo { color: var(--white); font-size: 26px; font-weight: 900; letter-spacing: -.04em; }
.foot nav { display: flex; flex-direction: column; }
.foot-link { color: #c3c8d1; font-size: 15px; line-height: 2; text-decoration: none; }
.foot-link:hover { color: var(--white); text-decoration: underline; }

@media (max-width: 960px) {
    .hero { grid-template-columns: minmax(0, 1fr); padding: 40px 0 56px; }
    .stack-wrap { height: 420px; transform: scale(.78); }
    .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .split2 { gap: 40px; grid-template-columns: minmax(0, 1fr); }
    .nav-links { display: none; }
}

@media (max-width: 600px) {
    .wrap { padding: 0 16px; }
    .steps, .incl { grid-template-columns: minmax(0, 1fr); }
    .stack-wrap { height: 340px; transform: scale(.62); }
    h1 { font-size: 44px; }
    h2 { font-size: 34px; }
    .foot-cta h2 { font-size: 40px; }
    .foot-grid { grid-template-columns: minmax(0, 1fr); }
    .actions .nav-link { display: none; }
}
</style>
