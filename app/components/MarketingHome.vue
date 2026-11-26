<script setup lang="ts">
// Slate's home page (shown at / once coming soon is off, and to platform admins before then).
const { sitesDomain } = useRuntimeConfig().public
const freeDomain = sitesDomain.includes('localhost') ? 'slatecms.co.uk' : sitesDomain

const page = marketingPage('/')
const steps = [
    { title: 'Create your account', text: `Name your site and it’s live straight away on a free ${freeDomain} address.` },
    { title: 'Pick a starting layout', text: 'Pages already in place for a trade, a salon, a shop, a club or a studio. Or start blank.' },
    { title: 'Make it yours', text: 'Click any block to change the words and pictures. Set your colours and fonts once.' },
    { title: 'Add your domain and publish', text: 'Buy a domain inside Slate or connect yours. HTTPS and email forwarding are set up for you.' }
]
const included = [
    { icon: 'star', title: 'Page editor and blocks', text: 'Heroes, services, galleries, prices, reviews and forms, ready to fill in. Undo any publish.', to: '/features/editor' },
    { icon: 'globe', title: 'Domains and email', text: 'Buy a .co.uk or .com, or connect one you own. Free forwarding from hello@yourbusiness.', to: '/features/domains-and-email' },
    { icon: 'chat', title: 'Forms and inbox', text: 'Quote and contact forms with spam protection. Replies land in your inbox and email.', to: '/features/forms' },
    { icon: 'chart', title: 'SEO and site health', text: 'A score and a fix-it list: missing descriptions, broken links, big pictures, all linked.', to: '/features/seo' },
    { icon: 'bolt', title: 'Integrations', text: 'Google Analytics, Search Console, Calendly, WhatsApp, Mailchimp and Slack by pasting a code.', to: '/features/integrations' },
    { icon: 'shield', title: 'Hosting that looks after itself', text: 'Fast pages from Cloudflare’s network, HTTPS on every address, and nothing to update.' }
]
const sectors = marketingSections('for')
const faqs: FaqItem[] = [
    { q: 'Do I need to know how to code?', a: 'No. You build pages by adding blocks and typing into them, and set your colours and fonts once for the whole site. If you can use email, you can use Slate.' },
    { q: 'Can I use a domain I already own?', a: 'Yes. Keep it wherever you bought it: Slate shows you the records to add, checks them and sets up HTTPS for you. Or buy a new one inside Slate and it’s connected automatically.' },
    { q: 'Do I get an email address with my domain?', a: 'Domains bought through Slate come with free email forwarding, so messages to hello@yourbusiness.co.uk arrive in the inbox you already use.' },
    { q: 'What happens if I cancel?', a: 'Your site goes offline at the end of your billing period. You can download everything before then as one file: pages, blog posts, images and form replies.' },
    { q: 'Where is my data kept?', a: 'Your pages, posts and form replies are stored in London. Pages are served to visitors from Cloudflare’s network, close to wherever they are, and every site’s content is kept separate.' },
    { q: 'Is there a contract?', a: `No. Pay monthly or yearly and cancel whenever you like. The first ${TRIAL_DAYS} days are free and you don’t need a card to start.` }
]

useMarketingSeo('/', {
    jsonLd: [
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': 'Slate',
            'url': MARKETING_SITE,
            'logo': `${MARKETING_SITE}/favicon.svg`,
            'email': 'hello@slatecms.co.uk',
            'address': { '@type': 'PostalAddress', 'addressLocality': 'Warrington', 'addressCountry': 'GB' }
        },
        { '@context': 'https://schema.org', '@type': 'WebSite', 'name': 'Slate', 'url': MARKETING_SITE, 'inLanguage': 'en-GB' },
        faqJsonLd(faqs)
    ]
})
</script>

<template>
    <div>
        <MkHero
            eyebrow="Website builder for UK small businesses"
            :title="page.h1"
            lead="Build your site from ready-made blocks, then run it all from one login: your domain, email forwarding, forms, blog and Google. No developer, no plugins, nothing to update."
            video="tour"
            video-caption="From sign-up to a live website (sped up)."
            :secondary="{ label: 'See how it works', to: '#how' }"
        />

        <section id="how" class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head">
                    <h2>From sign-up to live site in an afternoon</h2>
                    <p>Get a site you’re happy with on the first day, then keep changing it whenever you like.</p>
                </div>
                <ol class="steps">
                    <li v-for="(s, i) in steps" :key="s.title">
                        <span class="num">{{ i + 1 }}</span>
                        <b>{{ s.title }}</b>
                        <span>{{ s.text }}</span>
                    </li>
                </ol>
            </div>
        </section>

        <section class="mk-section">
            <div class="mk-wrap">
                <div class="mk-head">
                    <h2>Everything your site needs, already in the box</h2>
                    <p>One monthly price covers the lot. No add-ons to buy, no plugins to keep updated, no separate hosting bill.</p>
                </div>
                <MkFeatureGrid :items="included" />
                <p class="more"><NuxtLink to="/features">See every feature →</NuxtLink></p>
            </div>
        </section>

        <MkSplit
            eyebrow="The editor"
            title="Change anything by clicking it"
            text="Every page is a stack of blocks. Click one to change its words and pictures, drag to reorder, and publish when you’re ready. Visitors only see changes once you publish."
            :points="['Over 30 blocks, styled to match your colours and fonts', 'Every publish is saved, so you can go back to any version', 'Several people can edit, each with their own login']"
            video="editor"
            video-caption="Adding, editing and reordering blocks."
        />
        <MkSplit
            flip
            eyebrow="Getting found"
            title="A to-do list for Google, not a lecture"
            text="Slate checks your site and tells you exactly what to fix: the page missing a description, the link to a page that no longer exists, the picture that’s too big. Each one links straight to the fix."
            :points="['Sitemap and search engine pings handled for you', 'Redirects for old addresses when you move from another site', 'Share images for WhatsApp, Facebook and LinkedIn']"
            video="seo"
            video-caption="The site health check and the SEO page."
        />


        <section class="mk-section">
            <div class="mk-wrap">
                <div class="mk-head">
                    <h2>Built for businesses like yours</h2>
                    <p>Start from a layout made for your kind of business, with the pages and wording people expect.</p>
                </div>
                <ul class="sectors">
                    <li v-for="s in sectors" :key="s.path">
                        <NuxtLink :to="s.path"><b>{{ s.navLabel }}</b><span>{{ s.h1 }}</span><i aria-hidden="true">→</i></NuxtLink>
                    </li>
                </ul>
            </div>
        </section>

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head">
                    <h2>Simple pricing</h2>
                    <p>Every plan includes hosting, HTTPS, forms and the full editor. <NuxtLink to="/pricing">Compare plans in full</NuxtLink>.</p>
                </div>
                <MkPlans compact />
            </div>
        </section>

        <MkFaq :items="faqs" />
        <MkCta />
    </div>
</template>

<style scoped>
.steps { display: grid; gap: 32px; grid-template-columns: repeat(4, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
.steps li { border-top: 3px solid var(--quarry); display: flex; flex-direction: column; gap: 10px; padding-top: 20px; }
.num { color: var(--heather); font-size: 40px; font-weight: 300; line-height: 1; }
.steps b { font-size: 19px; }
.steps span:last-child { color: var(--text-body); font-size: 16px; line-height: 1.55; }
.more { font-size: 16px; font-weight: 700; margin: 28px 0 0; }
.more a, .mk-head a { color: var(--heather); }
.sectors { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); list-style: none; margin: 0; padding: 0; }
.sectors a { height: 100%; box-sizing: border-box; background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); color: inherit; display: grid; gap: 4px 12px; grid-template-columns: 1fr auto; padding: 20px 22px; text-decoration: none; }
.sectors a:hover { box-shadow: 0 0 0 1px var(--quarry), 3px 3px 0 var(--lichen); }
.sectors b { font-size: 18px; }
.sectors span { color: var(--text-body); font-size: 15px; grid-column: 1; }
.sectors i { align-self: center; color: var(--heather); font-style: normal; font-weight: 700; grid-column: 2; grid-row: 1 / 3; }
@media (max-width: 960px) { .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .steps { grid-template-columns: minmax(0, 1fr); } }
</style>
