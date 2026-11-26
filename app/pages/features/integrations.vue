<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
// Straight from the real catalogue, so this page always matches what's in the CMS
const groups = INTEGRATION_CATEGORIES.map(c => ({
    ...c,
    items: CATALOGUE.filter(i => i.category === c.key).sort((a, b) => Number(a.kind === 'soon') - Number(b.kind === 'soon') || a.name.localeCompare(b.name))
})).filter(g => g.items.length)
const sections = [
    { eyebrow: 'No plugins', title: 'Paste a code, and it’s connected', text: 'Each integration is a card with plain instructions: where to find your code, and where to paste it. There’s nothing to install, nothing to update and nothing that can break your site.', points: ['Turn any integration off with one click', 'Works on every page automatically', 'Tracking tools that need consent only run once a visitor agrees'], video: 'integrations', videoCaption: 'Connecting WhatsApp, then the button on the live site.' }
]
const faqs: FaqItem[] = [
    { q: 'Which integrations come with every plan?', a: 'Google Analytics, Plausible, Search Console, Bing, visitor stats and the WhatsApp button come with every plan. Business and Studio include all of them.' },
    { q: 'Do I need a cookie banner?', a: 'Only for tools that track people, like Google Analytics or the Meta Pixel. Slate shows a consent banner for those automatically. Slate’s own visitor stats don’t need one.' },
    { q: 'Can I connect something that isn’t listed?', a: 'Form replies can go to any service through a webhook, including Zapier and Make. Tell us what else you’d like to see.' }
]
</script>

<template>
    <MkFeaturePage
        path="/features/integrations"
        eyebrow="Integrations"
        lead="Connect analytics, search tools, booking, chat and email lists by pasting a code. No plugins to install, nothing to keep updated, and consent handled for tools that need it."
        video="integrations"
        video-caption="The Integrations page."
        :sections="sections"
        :faqs="faqs"
    >
        <section class="mk-section cat" aria-labelledby="all-h">
            <div class="mk-wrap">
                <div class="mk-head"><h2 id="all-h">Everything you can connect</h2></div>
                <div v-for="g in groups" :key="g.key" class="grp">
                    <h3>{{ g.name }}</h3>
                    <ul>
                        <li v-for="i in g.items" :key="i.id">
                            <span class="tile" :style="{ background: i.tile, color: i.ink ?? '#fff' }" aria-hidden="true">{{ i.mark }}</span>
                            <span class="t"><b>{{ i.name }}<em v-if="i.kind === 'soon'">Coming soon</em></b><span>{{ i.desc }}</span></span>
                        </li>
                    </ul>
                </div>
            </div>
        </section>
    </MkFeaturePage>
</template>

<style scoped>
.cat { background: var(--white); }
.grp + .grp { margin-top: 36px; }
h3 { color: var(--text-muted); font-size: 13px; font-weight: 700; letter-spacing: .08em; margin: 0 0 12px; text-transform: uppercase; }
ul { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); list-style: none; margin: 0; padding: 0; }
li { align-items: center; border-radius: 10px; box-shadow: 0 0 0 1px var(--line); display: flex; gap: 14px; padding: 14px 16px; }
.tile { align-items: center; border-radius: 9px; display: flex; flex: none; font-size: 17px; font-weight: 800; height: 40px; justify-content: center; width: 40px; }
.t { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.t b { align-items: center; display: flex; font-size: 15.5px; gap: 8px; }
.t em { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 11.5px; font-style: normal; font-weight: 700; padding: 2px 8px; }
.t span { color: var(--text-body); font-size: 14px; }
</style>
