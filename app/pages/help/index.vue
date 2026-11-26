<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const page = useMarketingSeo('/help')
const { comingSoon } = useRuntimeConfig().public
const { me } = useMe()
const plain = computed(() => !!comingSoon && !me.value?.isPlatformAdmin)
const { data } = await useFetch('/api/help')
const q = ref('')
const all = computed(() => (data.value?.areas ?? []).flatMap(a => a.articles.map(x => ({ ...x, area: a.name }))))
const words = computed(() => q.value.toLowerCase().split(/\s+/).filter(Boolean))
const matches = computed(() => words.value.length ? all.value.filter(a => words.value.every(w => `${a.title} ${a.summary} ${a.area}`.toLowerCase().includes(w))) : [])
const popular = computed(() => all.value.filter(a => a.popular))
const support = computed(() => me.value?.sites[0] ? `/sites/${me.value.sites[0].id}/support` : '/contact')
</script>

<template>
    <div>
        <MkPlainHeader v-if="plain" />
        <section class="top">
            <div class="mk-wrap">
                <p class="eyebrow">Help centre</p>
                <h1>{{ page.h1 }}</h1>
                <label class="search">
                    <span class="visually-hidden">Search help</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
                    <input v-model="q" type="search" placeholder="Search, for example “add a page” or “colours”" autocomplete="off">
                </label>
            </div>
        </section>

        <div class="mk-wrap body">
            <section v-if="words.length" aria-live="polite">
                <h2 class="sub">{{ matches.length ? `${matches.length} ${matches.length === 1 ? 'article' : 'articles'}` : 'No articles match' }}</h2>
                <ul v-if="matches.length" class="rows">
                    <li v-for="a in matches" :key="a.slug"><NuxtLink :to="`/help/${a.slug}`"><b>{{ a.title }}</b><span>{{ a.area }} · {{ a.summary }}</span></NuxtLink></li>
                </ul>
                <p v-else class="none">Try fewer words, or <NuxtLink :to="support">ask us</NuxtLink> and we’ll help.</p>
            </section>

            <template v-else>
                <section v-if="popular.length">
                    <h2 class="sub">Popular</h2>
                    <ul class="pop">
                        <li v-for="a in popular" :key="a.slug"><NuxtLink :to="`/help/${a.slug}`">{{ a.title }}</NuxtLink></li>
                    </ul>
                </section>

                <ul class="areas">
                    <li v-for="a in data?.areas" :id="a.key" :key="a.key" class="area">
                        <div class="ah">
                            <span class="ic"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path :d="showcaseIcon(a.icon)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg></span>
                            <span><h2>{{ a.name }}</h2><span class="blurb">{{ a.blurb }}</span></span>
                        </div>
                        <ul class="links">
                            <li v-for="x in a.articles" :key="x.slug"><NuxtLink :to="`/help/${x.slug}`">{{ x.title }}</NuxtLink></li>
                        </ul>
                    </li>
                </ul>
            </template>

            <aside class="stuck">
                <b>Can’t find what you need?</b>
                <span>Ask us and a real person will reply, usually within a working day.</span>
                <NuxtLink class="btn btn-dark" :to="support">{{ me?.sites[0] ? 'Ask in Support' : 'Contact us' }}</NuxtLink>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.top { background: var(--quarry); color: var(--white); padding: 56px 0 64px; }
.eyebrow { color: var(--lichen); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0 0 12px; text-transform: uppercase; }
h1 { font-size: clamp(36px, 5vw, 56px); font-weight: 900; letter-spacing: -.04em; line-height: 1; margin: 0 0 28px; }
.search { align-items: center; background: var(--white); border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 25%); color: var(--text-muted); display: flex; gap: 12px; max-width: 680px; padding: 0 18px; }
.search input { background: none; border: 0; color: var(--text); flex: 1; font: inherit; font-size: 18px; min-height: 60px; outline: 0; }
.search:focus-within { box-shadow: 0 0 0 3px var(--lichen), 0 10px 30px rgb(0 0 0 / 25%); }
.body { display: flex; flex-direction: column; gap: 40px; padding-bottom: 88px; padding-top: 48px; }
.sub { color: var(--text-muted); font-size: 13px; font-weight: 700; letter-spacing: .08em; margin: 0 0 14px; text-transform: uppercase; }
.pop { display: flex; flex-wrap: wrap; gap: 10px; list-style: none; margin: 0; padding: 0; }
.pop a { background: var(--white); border-radius: 999px; box-shadow: inset 0 0 0 1px var(--line); color: var(--quarry); display: inline-block; font-size: 15px; font-weight: 600; padding: 10px 18px; text-decoration: none; }
.pop a:hover { box-shadow: inset 0 0 0 1.5px var(--quarry); }
.areas { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); list-style: none; margin: 0; padding: 0; }
.area { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); padding: 22px 24px; scroll-margin-top: 90px; }
.area:target { box-shadow: 0 0 0 2px var(--quarry), 4px 4px 0 var(--lichen); }
.ah { align-items: flex-start; display: flex; gap: 14px; margin-bottom: 14px; }
.ic { align-items: center; background: var(--mist); border-radius: 10px; color: var(--heather); display: flex; flex: none; height: 42px; justify-content: center; width: 42px; }
.ah h2 { font-size: 19px; margin: 0; }
.blurb { color: var(--text-muted); font-size: 14px; }
.links { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }
.links a { border-top: 1px solid var(--line-soft); color: var(--quarry); display: block; font-size: 15.5px; padding: 9px 0; text-decoration: none; }
.links a:hover { color: var(--heather); text-decoration: underline; text-underline-offset: 3px; }
.rows { display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 0; padding: 0; }
.rows a { background: var(--white); border-radius: 10px; box-shadow: 0 0 0 1px var(--line); color: inherit; display: flex; flex-direction: column; gap: 3px; padding: 14px 18px; text-decoration: none; }
.rows a:hover { box-shadow: 0 0 0 1px var(--quarry); }
.rows span { color: var(--text-muted); font-size: 14px; }
.none { font-size: 17px; margin: 0; }
.none a { color: var(--heather); }
.stuck { align-items: center; background: var(--mist); border-radius: 12px; display: flex; flex-wrap: wrap; gap: 8px 18px; padding: 22px 26px; }
.stuck b { font-size: 18px; }
.stuck span { color: var(--text-body); flex: 1; min-width: 220px; }
</style>
