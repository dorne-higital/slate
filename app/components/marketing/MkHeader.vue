<script setup lang="ts">
// Slate's own site header, with mega menus for Features and Who it's for.
// Menus are <details>, so they open before (or without) JavaScript; script just tidies up closing them.
const MENU: Record<string, { icon: string, blurb: string }> = {
    '/features/editor': { icon: 'star', blurb: 'Build pages from ready-made blocks, then undo any publish' },
    '/features/domains-and-email': { icon: 'globe', blurb: 'Buy or connect a domain, with free email forwarding' },
    '/features/forms': { icon: 'chat', blurb: 'Quote and contact forms with an inbox and spam protection' },
    '/features/seo': { icon: 'chart', blurb: 'A health check that shows what to fix to get found' },
    '/features/integrations': { icon: 'bolt', blurb: 'Analytics, booking, WhatsApp, Mailchimp and more' },
    '/for/trades': { icon: 'shield', blurb: 'Plumbers, electricians, builders and decorators' },
    '/for/salons-and-clinics': { icon: 'heart', blurb: 'Hair, beauty, therapists and clinics' },
    '/for/shops-and-cafes': { icon: 'gift', blurb: 'Local shops, cafés, bakeries and makers' },
    '/for/clubs-and-charities': { icon: 'people', blurb: 'Sports clubs, charities and community groups' },
    '/for/freelancers-and-studios': { icon: 'camera', blurb: 'Designers and agencies building client sites' }
}
const withMeta = (pages: MarketingPage[]) => pages.map(p => ({ ...p, ...MENU[p.path]! }))
const features = withMeta(marketingSections('features').filter(p => p.path !== '/features'))
const sectors = withMeta(marketingSections('for'))
const compare = marketingSections('compare')
// Bound, not literal: the poster is a static file made by the demo recorder, not a bundled asset
const tourPoster = '/videos/tour.webp'

const { me } = useMe()
const dashboard = computed(() => me.value?.isPlatformAdmin ? '/admin' : me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/sites')

const root = ref<HTMLElement>()
const closeAll = () => root.value?.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'))
const route = useRoute()
watch(() => route.fullPath, closeAll)
// Only one menu open at a time
function onToggle(e: Event) {
    const d = e.target as HTMLDetailsElement
    if (d.open) root.value?.querySelectorAll('details[open]').forEach(o => o !== d && o.removeAttribute('open'))
}
function outside(e: MouseEvent) {
    if (!root.value?.contains(e.target as Node)) closeAll()
}
function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') closeAll()
}
onMounted(() => {
    document.addEventListener('click', outside)
    document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', outside)
    document.removeEventListener('keydown', onKey)
})
</script>

<template>
    <header ref="root" class="mk-top">
        <div class="mk-wrap mk-bar">
            <NuxtLink to="/" aria-label="Slate home" class="home"><BrandMark /></NuxtLink>

            <nav class="links" aria-label="Main">
                <details class="dd" @toggle="onToggle">
                    <summary>Features <span class="car" aria-hidden="true" /></summary>
                    <div class="mega">
                        <div class="mk-wrap mega-in">
                            <div class="col">
                                <p class="mh">What’s included</p>
                                <div class="items two">
                                    <NuxtLink v-for="f in features" :key="f.path" :to="f.path" class="mi">
                                        <span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(f.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                                        <span class="mt"><b>{{ f.navLabel }}</b><span>{{ f.blurb }}</span></span>
                                    </NuxtLink>
                                </div>
                            </div>
                            <NuxtLink to="/features" class="feature-tile">
                                <span class="ft-shot" aria-hidden="true">
                                    <img :src="tourPoster" alt="" loading="lazy" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
                                    <span class="ft-play"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5l9 5.5-9 5.5z" fill="currentColor" /></svg></span>
                                </span>
                                <b>See everything Slate does</b>
                                <span>A one-minute tour, from sign-up to a live website.</span>
                                <span class="arrow">All features →</span>
                            </NuxtLink>
                        </div>
                    </div>
                </details>

                <details class="dd" @toggle="onToggle">
                    <summary>Who it’s for <span class="car" aria-hidden="true" /></summary>
                    <div class="mega">
                        <div class="mk-wrap mega-in">
                            <div class="col">
                                <p class="mh">Made for</p>
                                <div class="items two">
                                    <NuxtLink v-for="s in sectors" :key="s.path" :to="s.path" class="mi">
                                        <span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(s.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                                        <span class="mt"><b>{{ s.navLabel }}</b><span>{{ s.blurb }}</span></span>
                                    </NuxtLink>
                                </div>
                            </div>
                            <div class="side">
                                <p class="mh">Moving from somewhere else?</p>
                                <NuxtLink v-for="c in compare" :key="c.path" :to="c.path" class="cmp">{{ c.navLabel }} <span aria-hidden="true">→</span></NuxtLink>
                                <NuxtLink to="/guides" class="cmp muted-link">Guides for small business websites <span aria-hidden="true">→</span></NuxtLink>
                            </div>
                        </div>
                    </div>
                </details>

                <NuxtLink to="/pricing" class="nl">Pricing</NuxtLink>
                <NuxtLink to="/guides" class="nl">Guides</NuxtLink>
            </nav>

            <div class="acts">
                <NuxtLink v-if="me" :to="dashboard" class="btn btn-lichen">Go to your sites</NuxtLink>
                <template v-else>
                    <NuxtLink to="/login" class="nl login">Log in</NuxtLink>
                    <NuxtLink to="/signup" class="btn btn-lichen">Start free trial</NuxtLink>
                </template>

                <details class="dd mob" @toggle="onToggle">
                    <summary aria-label="Menu"><span class="burger" aria-hidden="true"><i /><i /><i /></span></summary>
                    <div class="sheet">
                        <p class="mh">Features</p>
                        <NuxtLink v-for="f in features" :key="f.path" :to="f.path" class="mi">
                            <span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(f.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                            <span class="mt"><b>{{ f.navLabel }}</b></span>
                        </NuxtLink>
                        <p class="mh">Who it’s for</p>
                        <NuxtLink v-for="s in sectors" :key="s.path" :to="s.path" class="mi">
                            <span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(s.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                            <span class="mt"><b>{{ s.navLabel }}</b></span>
                        </NuxtLink>
                        <p class="mh">More</p>
                        <NuxtLink to="/pricing" class="mi plain"><b>Pricing</b></NuxtLink>
                        <NuxtLink to="/guides" class="mi plain"><b>Guides</b></NuxtLink>
                        <NuxtLink v-if="!me" to="/login" class="mi plain"><b>Log in</b></NuxtLink>
                    </div>
                </details>
            </div>
        </div>
    </header>
</template>

<style scoped>
.mk-top { background: rgb(247 248 250 / 94%); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line-soft); position: sticky; top: 0; z-index: 50; }
.mk-bar { align-items: center; display: flex; gap: 24px; min-height: 72px; }
.home { text-decoration: none; }
.links { align-items: center; display: flex; flex: 1; gap: 4px; margin-left: 16px; }
.nl, summary { border-radius: var(--radius); color: var(--quarry); cursor: pointer; font-size: 15px; font-weight: 600; padding: 10px 12px; text-decoration: none; }
.nl:hover, summary:hover, details[open] > summary { background: var(--mist); }
.nl.router-link-active { text-decoration: underline; text-underline-offset: 5px; }
summary { align-items: center; display: flex; gap: 7px; list-style: none; user-select: none; }
summary::-webkit-details-marker { display: none; }
summary:focus-visible, .nl:focus-visible, .mi:focus-visible { outline: 3px solid var(--lichen-focus); outline-offset: 1px; }
.car { border-bottom: 2px solid currentColor; border-right: 2px solid currentColor; height: 7px; margin-top: -4px; transform: rotate(45deg); transition: transform .18s, margin .18s; width: 7px; }
details[open] .car { margin-top: 3px; transform: rotate(225deg); }

/* Mega panel: full width under the header bar */
.links .dd { position: static; }
.mega { animation: drop .18s ease-out; background: var(--white); border-bottom: 1px solid var(--line); box-shadow: 0 24px 48px -16px rgb(46 52 69 / 22%); left: 0; position: absolute; right: 0; top: 100%; }
.mega::before { background: linear-gradient(90deg, var(--heather), var(--lichen)); content: ''; display: block; height: 3px; }
.mega-in { display: grid; gap: 40px; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); padding-bottom: 32px; padding-top: 28px; }
@keyframes drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.mh { color: var(--text-muted); font-size: 12px; font-weight: 700; letter-spacing: .08em; margin: 0 0 12px; text-transform: uppercase; }
.items { display: grid; gap: 4px; }
.items.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.mi { align-items: flex-start; border-radius: 10px; color: var(--quarry); display: flex; gap: 14px; padding: 12px; text-decoration: none; transition: background .12s; }
.mi:hover { background: var(--paper); }
.mi:hover .ic { background: var(--quarry); color: var(--lichen); }
.ic { align-items: center; background: var(--mist); border-radius: 9px; color: var(--heather); display: flex; flex: none; height: 40px; justify-content: center; transition: background .12s, color .12s; width: 40px; }
.mt { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mt b { font-size: 15.5px; }
.mt span { color: var(--text-muted); font-size: 14px; line-height: 1.4; }

.feature-tile { background: var(--quarry); border-radius: 12px; color: #c3c8d1; display: flex; flex-direction: column; gap: 6px; padding: 14px 14px 18px; text-decoration: none; }
.feature-tile b { color: var(--white); font-size: 17px; margin-top: 8px; }
.feature-tile span { font-size: 14px; line-height: 1.45; }
.feature-tile .arrow { color: var(--lichen); font-weight: 700; margin-top: 4px; }
.feature-tile:hover .arrow { text-decoration: underline; text-underline-offset: 4px; }
.ft-shot { aspect-ratio: 16 / 9; background: linear-gradient(135deg, #3b4256, #5b5773); border-radius: 8px; display: block; overflow: hidden; position: relative; }
.ft-shot img { height: 100%; object-fit: cover; width: 100%; }
.ft-play { align-items: center; background: var(--lichen); border-radius: 50%; color: var(--quarry); display: flex; height: 40px; justify-content: center; left: 50%; position: absolute; top: 50%; transform: translate(-50%, -50%); width: 40px; }

.side { background: var(--paper); border-radius: 12px; display: flex; flex-direction: column; padding: 18px 18px 12px; }
.cmp { border-top: 1px solid var(--line-soft); color: var(--quarry); display: flex; font-size: 15px; font-weight: 600; justify-content: space-between; padding: 12px 2px; text-decoration: none; }
.cmp:first-of-type { border-top: 0; }
.cmp:hover { color: var(--heather); }
.cmp:hover span { transform: translateX(3px); }
.cmp span { transition: transform .12s; }
.muted-link { color: var(--text-body); font-weight: 500; }

.acts { align-items: center; display: flex; gap: 8px; margin-left: auto; }
.mob { display: none; position: relative; }
.burger { display: flex; flex-direction: column; gap: 4px; width: 20px; }
.burger i { background: currentColor; border-radius: 2px; height: 2px; }
.sheet { animation: drop .18s ease-out; background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line), 0 18px 40px rgb(46 52 69 / 18%); display: flex; flex-direction: column; max-height: calc(100vh - 90px); overflow: auto; padding: 8px 8px 12px; position: absolute; right: 0; top: calc(100% + 8px); width: min(340px, calc(100vw - 32px)); }
.sheet .mh { margin: 14px 12px 4px; }
.sheet .mi { align-items: center; padding: 8px 12px; }
.sheet .ic { height: 32px; width: 32px; }
.mi.plain { padding: 10px 12px; }
@media (prefers-reduced-motion: reduce) { .mega, .sheet { animation: none; } }
@media (max-width: 960px) {
    .links { display: none; }
    .mob { display: block; }
}
@media (max-width: 480px) {
    .login { display: none; }
    .mk-bar { gap: 8px; }
}
</style>
