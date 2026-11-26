<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const sections = [
    { eyebrow: 'Site health', title: 'A score, and exactly what to fix', text: 'Slate checks your whole site and lists what’s holding it back, most important first: the link that goes nowhere, the page with no description, the picture that’s too big. Each item names the page and block and links straight to the fix.', points: ['Broken links in pages and menus', 'Missing descriptions, share images and picture descriptions', 'Oversized images, unpublished changes and replies left waiting'], video: 'seo', videoCaption: 'The site health check, then fixing a page’s description.' },
    { eyebrow: 'Search results', title: 'See how you’ll look on Google', text: 'Write each page’s title and description and see a preview of how it could appear in search results. Pages without a description use your site-wide one, so nothing is left blank.', points: ['Titles and descriptions for every page', 'A Google preview as you type', 'Hide any page from search engines'] },
    { eyebrow: 'Sharing', title: 'Look good when people share you', text: 'Choose the picture shown when someone shares a page on WhatsApp, Facebook or LinkedIn, from your media library or any address. Set one for the whole site and override it page by page.' },
    { eyebrow: 'Moving to Slate', title: 'Keep your place on Google when you move', text: 'Moving from Wix, WordPress or Squarespace? Paste your old addresses and where they now live, and Slate sends visitors and Google to the right place with permanent redirects.', points: ['Add one at a time, or paste a whole list', 'Counts how often each redirect is used', 'Works for pages and blog posts'] }
]
const grid = {
    title: 'The technical bits, done for you',
    items: [
        { icon: 'globe', title: 'Sitemap and robots.txt', text: 'Kept up to date automatically as you add and publish pages.' },
        { icon: 'bolt', title: 'IndexNow', text: 'Bing and others are told when you publish, so changes show up sooner.' },
        { icon: 'shield', title: 'Fast and secure', text: 'Pages served from Cloudflare’s network over HTTPS, which search engines reward.' },
        { icon: 'tick', title: 'Search Console and Bing', text: 'Prove you own your site to Google and Bing by pasting one code.' },
        { icon: 'chart', title: 'Visitor stats', text: 'Visits and top pages on your Overview, with no cookies and no banner.' },
        { icon: 'camera', title: 'Picture descriptions', text: 'Alt text on every image, and reminders where it’s missing.' }
    ]
}
const faqs: FaqItem[] = [
    { q: 'Will Slate get me to the top of Google?', a: 'No website builder can promise that. What Slate does is handle the technical side properly and show you the things that are in your hands, like good descriptions, working links and fast pages.' },
    { q: 'I’m moving from another website. Will I lose my rankings?', a: 'Not if your old addresses point to the new ones. Add redirects in Slate for any page whose address changes, and Google carries your place across.' },
    { q: 'Do I need an SEO plugin?', a: 'No. Titles, descriptions, share images, sitemaps, redirects and search engine pings are all built in.' },
    { q: 'Do visitor stats need a cookie banner?', a: 'No. Slate’s visitor stats use Cloudflare Web Analytics, which doesn’t use cookies or identify anyone.' }
]
</script>

<template>
    <MkFeaturePage
        path="/features/seo"
        eyebrow="SEO and site health"
        lead="Slate handles the technical side of search for you and shows a clear list of what to fix: missing descriptions, broken links, big pictures and more, each with a link straight to the fix."
        video="seo"
        video-caption="Site health and the SEO page."
        :sections="sections"
        :grid="grid"
        :faqs="faqs"
    />
</template>
