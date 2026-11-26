<script setup lang="ts">
// Slate's own site header. Menus are <details> so they work before (or without) JavaScript.
const features = marketingSections('features')
const sectors = marketingSections('for')
const { me } = useMe()
const dashboard = computed(() => me.value?.isPlatformAdmin ? '/admin' : me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/sites')

// Close any open menu after navigating or clicking elsewhere
const root = ref<HTMLElement>()
const closeAll = () => root.value?.querySelectorAll('details[open]').forEach(d => d.removeAttribute('open'))
const route = useRoute()
watch(() => route.fullPath, closeAll)
function outside(e: MouseEvent) {
    root.value?.querySelectorAll('details[open]').forEach((d) => {
        if (!d.contains(e.target as Node)) d.removeAttribute('open')
    })
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
                <details class="dd">
                    <summary>Features <span class="car" aria-hidden="true" /></summary>
                    <div class="menu wide">
                        <NuxtLink v-for="f in features" :key="f.path" :to="f.path" class="mi">
                            <b>{{ f.navLabel }}</b>
                            <span>{{ f.h1 }}</span>
                        </NuxtLink>
                    </div>
                </details>
                <details class="dd">
                    <summary>Who it’s for <span class="car" aria-hidden="true" /></summary>
                    <div class="menu">
                        <NuxtLink v-for="s in sectors" :key="s.path" :to="s.path" class="mi"><b>{{ s.navLabel }}</b></NuxtLink>
                    </div>
                </details>
                <NuxtLink to="/pricing" class="nl">Pricing</NuxtLink>
                <NuxtLink to="/guides" class="nl">Guides</NuxtLink>
            </nav>

            <div class="acts">
                <template v-if="me">
                    <NuxtLink :to="dashboard" class="btn btn-lichen">Go to your sites</NuxtLink>
                </template>
                <template v-else>
                    <NuxtLink to="/login" class="nl login">Log in</NuxtLink>
                    <NuxtLink to="/signup" class="btn btn-lichen">Start free trial</NuxtLink>
                </template>

                <details class="dd mob">
                    <summary aria-label="Menu"><span class="burger" aria-hidden="true"><i /><i /><i /></span></summary>
                    <div class="menu sheet">
                        <p class="mh">Features</p>
                        <NuxtLink v-for="f in features" :key="f.path" :to="f.path" class="mi"><b>{{ f.navLabel }}</b></NuxtLink>
                        <p class="mh">Who it’s for</p>
                        <NuxtLink v-for="s in sectors" :key="s.path" :to="s.path" class="mi"><b>{{ s.navLabel }}</b></NuxtLink>
                        <p class="mh">More</p>
                        <NuxtLink to="/pricing" class="mi"><b>Pricing</b></NuxtLink>
                        <NuxtLink to="/guides" class="mi"><b>Guides</b></NuxtLink>
                        <NuxtLink v-if="!me" to="/login" class="mi"><b>Log in</b></NuxtLink>
                    </div>
                </details>
            </div>
        </div>
    </header>
</template>

<style scoped>
.mk-top { background: rgb(247 248 250 / 92%); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line-soft); position: sticky; top: 0; z-index: 50; }
.mk-bar { align-items: center; display: flex; gap: 24px; min-height: 72px; }
.home { text-decoration: none; }
.links { align-items: center; display: flex; flex: 1; gap: 6px; margin-left: 16px; }
.nl, summary { border-radius: var(--radius); color: var(--quarry); cursor: pointer; font-size: 15px; font-weight: 600; padding: 10px 12px; text-decoration: none; }
.nl:hover, summary:hover { background: var(--mist); }
.nl.router-link-active { text-decoration: underline; text-underline-offset: 5px; }
summary { align-items: center; display: flex; gap: 6px; list-style: none; }
summary::-webkit-details-marker { display: none; }
.car { border-bottom: 2px solid currentColor; border-right: 2px solid currentColor; height: 7px; margin-top: -4px; transform: rotate(45deg); transition: transform .15s; width: 7px; }
details[open] .car { margin-top: 3px; transform: rotate(225deg); }
.dd { position: relative; }
.menu { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line), 0 18px 40px rgb(46 52 69 / 16%); display: grid; gap: 2px; left: 0; min-width: 240px; padding: 8px; position: absolute; top: calc(100% + 8px); }
.menu.wide { grid-template-columns: repeat(2, minmax(0, 260px)); }
.mi { border-radius: var(--radius); color: var(--quarry); display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; text-decoration: none; }
.mi:hover { background: var(--paper); }
.mi b { font-size: 15px; }
.mi span { color: var(--text-muted); font-size: 13.5px; line-height: 1.4; }
.acts { align-items: center; display: flex; gap: 8px; margin-left: auto; }
.mob { display: none; }
.burger { display: flex; flex-direction: column; gap: 4px; width: 20px; }
.burger i { background: currentColor; border-radius: 2px; height: 2px; }
.sheet { left: auto; max-height: 75vh; overflow: auto; right: 0; width: min(320px, calc(100vw - 32px)); }
.mh { color: var(--text-muted); font-size: 12px; font-weight: 700; letter-spacing: .06em; margin: 10px 12px 2px; text-transform: uppercase; }
@media (max-width: 900px) {
    .links { display: none; }
    .mob { display: block; }
}
@media (max-width: 480px) {
    .login { display: none; }
    .mk-bar { gap: 8px; }
}
</style>
