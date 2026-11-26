<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const page = useMarketingSeo('/features')
const main = [
    { icon: 'star', title: 'Editor and blocks', text: '31 ready-made blocks, your colours and fonts set once, and every published version kept.', to: '/features/editor' },
    { icon: 'globe', title: 'Domains and email', text: 'Buy a domain in Slate or connect yours. HTTPS and email forwarding set up for you.', to: '/features/domains-and-email' },
    { icon: 'chat', title: 'Forms and inbox', text: 'Contact and quote forms, spam stopped without puzzles, and replies you can mark done.', to: '/features/forms' },
    { icon: 'chart', title: 'SEO and site health', text: 'A score and a fix-it list, Google previews, share images, redirects and sitemaps.', to: '/features/seo' },
    { icon: 'bolt', title: 'Integrations', text: 'Analytics, Search Console, Calendly, WhatsApp, Mailchimp, Slack and more.', to: '/features/integrations' }
]
const more = [
    { icon: 'calendar', title: 'Blog', text: 'Posts with cover images and categories, scheduled for when you want them out.' },
    { icon: 'camera', title: 'Projects', text: 'Case studies and portfolio pieces, each with its own page.' },
    { icon: 'people', title: 'Team access', text: 'Owners, admins, editors and viewers, each with their own login.' },
    { icon: 'clock', title: 'Page history', text: 'The last 30 published versions of every page, ready to restore.' },
    { icon: 'shield', title: 'Hosting and HTTPS', text: 'Fast pages from Cloudflare’s network, secure on every address.' },
    { icon: 'leaf', title: 'Visitor stats', text: 'Visits and top pages on your Overview, without cookies.' },
    { icon: 'lock', title: 'Your data in the UK', text: 'Pages, posts and form replies stored in London, each site kept separate.' },
    { icon: 'gift', title: 'Download everything', text: 'Your pages, posts, pictures and form replies in one file, whenever you want.' },
    { icon: 'heart', title: 'Real support', text: 'Ask from inside Slate and hear back from a person, not a bot.' }
]
</script>

<template>
    <div>
        <MkHero eyebrow="Features" :title="page.h1" lead="Slate is one place to build your website and keep it running: the editor, your domain and email, forms, search and the tools you already use, all in one monthly price." video="tour" video-caption="A quick tour of Slate (sped up)." :secondary="{ label: 'See pricing', to: '/pricing' }" />
        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>The main parts</h2><p>Each has its own page with a short video of how it works.</p></div>
                <MkFeatureGrid :items="main" />
            </div>
        </section>
        <section class="mk-section">
            <div class="mk-wrap">
                <div class="mk-head"><h2>And the rest</h2><p>The things you’d only notice if they were missing.</p></div>
                <MkFeatureGrid :items="more" />
            </div>
        </section>
        <MkCta />
    </div>
</template>
