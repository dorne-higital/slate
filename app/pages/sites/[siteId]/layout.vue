<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

const [{ data: site, refresh: refreshSite }, { data: menus }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`menus-${siteId}`, () => fetcher<{ header: MenuItem[], footer: MenuItem[], legal: MenuItem[] }>(`/api/sites/${siteId}/menus`))
])
useHead(() => ({ title: 'Layout · Slate', link: [{ rel: 'stylesheet', href: themeFontsHref(theme.value) }] }))

const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.admin)
const LAYOUT_KEYS = ['headerStyle', 'headerColour', 'headerSticky', 'headerGlass', 'headerSocials', 'footerStyle', 'footerColour', 'footerLogo'] as const
type LayoutSettings = Pick<Required<SiteTheme>, typeof LAYOUT_KEYS[number]>
const full = computed<Required<SiteTheme>>(() => ({ ...DEFAULT_THEME, ...(site.value?.theme as SiteTheme) }))
const pickLayout = (t: Required<SiteTheme>) => Object.fromEntries(LAYOUT_KEYS.map(k => [k, t[k]])) as LayoutSettings
const saved = ref<LayoutSettings>(pickLayout(full.value))
const layout = ref<LayoutSettings>({ ...saved.value })
const theme = computed<Required<SiteTheme>>(() => ({ ...full.value, ...layout.value }))
const dirty = computed(() => JSON.stringify(layout.value) !== JSON.stringify(saved.value))
const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const hasSocials = computed(() => Object.keys((site.value?.socials as SiteSocials) ?? {}).length > 0)

const headerStyles = [
    { key: 'standard', name: 'Standard', desc: 'Name or logo on the left, links on the right' },
    { key: 'centred', name: 'Centred', desc: 'Logo in the middle with the links underneath' },
    { key: 'mega', name: 'Mega menu', desc: 'Dropdowns open as a wide panel, good for lots of pages' }
] as const
const colourChoices = computed(() => {
    const t = full.value
    return [
        { key: 'page', name: 'Page', colour: t.scheme === 'dark' ? t.dark : t.background },
        { key: 'soft', name: 'Soft', colour: t.soft },
        { key: 'dark', name: 'Dark', colour: t.dark },
        { key: 'primary', name: 'Main', colour: t.primary },
        { key: 'accent', name: 'Accent', colour: t.accent }
    ] as const
})
const footerStyles = [
    { key: 'simple', name: 'Simple', desc: 'Your links in a single row' },
    { key: 'columns', name: 'Columns', desc: 'Each top-level footer link heads a column of the links nested under it in Menus' }
] as const

async function save() {
    status.value = 'saving'
    try {
        const res = await $fetch<SiteTheme>(`/api/sites/${siteId}/theme`, { method: 'PUT', body: layout.value })
        saved.value = pickLayout({ ...DEFAULT_THEME, ...res })
        layout.value = { ...saved.value }
        status.value = 'saved'
        await refreshSite()
    } catch {
        status.value = 'error'
    }
}

const sample: Block[] = [{ id: 'l1', type: 'hero', props: { heading: 'Your page content', text: 'The header and footer above and below appear on every page.', buttonLabel: '', buttonUrl: '' } }]
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Layout</h1>
            <div v-if="canEdit" class="row">
                <span v-if="status === 'saved' && !dirty" class="muted" role="status">Saved. Your live site uses it now.</span>
                <span v-if="status === 'error'" class="err" role="alert">Couldn’t save. Check your connection and try again.</span>
                <button class="btn btn-ghost" type="button" :disabled="!dirty" @click="layout = { ...saved }">Discard changes</button>
                <button class="btn btn-dark" type="button" :disabled="!dirty || status === 'saving'" @click="save">{{ status === 'saving' ? 'Saving…' : 'Save layout' }}</button>
            </div>
        </div>
        <p class="lead">How the header and footer look on every page. What’s in them is set in <NuxtLink :to="`/sites/${siteId}/menus`">Menus</NuxtLink>; colours and fonts in <NuxtLink :to="`/sites/${siteId}/theme`">Theme</NuxtLink>.</p>

        <div class="two">
            <div class="controls">
                <section class="panel box" aria-labelledby="hs-h">
                    <h2 id="hs-h">Header style</h2>
                    <div class="cards" role="radiogroup" aria-labelledby="hs-h">
                        <button v-for="h in headerStyles" :key="h.key" type="button" role="radio" class="card" :class="{ on: layout.headerStyle === h.key }" :aria-checked="layout.headerStyle === h.key" :disabled="!canEdit" @click="layout.headerStyle = h.key">
                            <span class="sketch" :class="h.key" aria-hidden="true"><i class="lg" /><i /><i /><i /></span>
                            <b>{{ h.name }}</b>
                            <span class="muted">{{ h.desc }}</span>
                        </button>
                    </div>
                    <p v-if="layout.headerStyle === 'mega'" class="help">Nest links under a header link in <NuxtLink :to="`/sites/${siteId}/menus`">Menus</NuxtLink> to fill its panel.</p>
                </section>

                <section class="panel box" aria-labelledby="hc-h">
                    <h2 id="hc-h">Header</h2>
                    <div class="field">
                        <span class="lb">Background</span>
                        <div class="swatches" role="radiogroup" aria-label="Header background">
                            <button v-for="c in colourChoices" :key="c.key" type="button" role="radio" class="sw" :class="{ on: layout.headerColour === c.key }" :aria-checked="layout.headerColour === c.key" :disabled="!canEdit" @click="layout.headerColour = c.key">
                                <i :style="{ background: c.colour }" />{{ c.name }}
                            </button>
                        </div>
                    </div>
                    <label class="check"><input v-model="layout.headerSticky" type="checkbox" :disabled="!canEdit"> Keep the header at the top while scrolling</label>
                    <label class="check"><input v-model="layout.headerGlass" type="checkbox" :disabled="!canEdit"> Frosted glass: see the page blurred through the header as it scrolls underneath</label>
                    <p v-if="layout.headerGlass && !layout.headerSticky" class="help">Glass shows best with the header kept at the top while scrolling.</p>
                    <label class="check"><input v-model="layout.headerSocials" type="checkbox" :disabled="!canEdit"> Show social media icons in the header</label>
                    <p v-if="layout.headerSocials && !hasSocials" class="help">Add your social links in <NuxtLink :to="`/sites/${siteId}/settings`">Settings</NuxtLink> first.</p>
                </section>

                <section class="panel box" aria-labelledby="fs-h">
                    <h2 id="fs-h">Footer</h2>
                    <div class="cards two-up" role="radiogroup" aria-label="Footer style">
                        <button v-for="f in footerStyles" :key="f.key" type="button" role="radio" class="card" :class="{ on: layout.footerStyle === f.key }" :aria-checked="layout.footerStyle === f.key" :disabled="!canEdit" @click="layout.footerStyle = f.key">
                            <b>{{ f.name }}</b>
                            <span class="muted">{{ f.desc }}</span>
                        </button>
                    </div>
                    <div class="field">
                        <span class="lb">Background</span>
                        <div class="swatches" role="radiogroup" aria-label="Footer background">
                            <button v-for="c in colourChoices" :key="c.key" type="button" role="radio" class="sw" :class="{ on: layout.footerColour === c.key }" :aria-checked="layout.footerColour === c.key" :disabled="!canEdit" @click="layout.footerColour = c.key">
                                <i :style="{ background: c.colour }" />{{ c.name }}
                            </button>
                        </div>
                    </div>
                    <div class="field">
                        <span class="lb">Footer logo</span>
                        <div class="img-row">
                            <img v-if="layout.footerLogo" :src="layout.footerLogo" alt="" class="logo-prev" :style="{ background: colourChoices.find(c => c.key === layout.footerColour)?.colour }">
                            <span v-else class="muted">{{ full.logo ? (full.logoOnDark && layout.footerColour !== 'page' && layout.footerColour !== 'soft' ? 'Using your logo for dark backgrounds (from Theme).' : 'Using your main logo (from Theme).') : 'No logo: your site name shows.' }}</span>
                            <MediaPicker v-if="canEdit" :site-id="siteId" @pick="layout.footerLogo = $event.url" />
                            <button v-if="layout.footerLogo && canEdit" class="btn btn-plain btn-sm" type="button" @click="layout.footerLogo = ''">Use the Theme logo</button>
                        </div>
                        <span class="help">Pick a different image if your logo doesn’t show up well on the footer colour, e.g. a white version.</span>
                    </div>
                    <p class="help">Social icons show in the footer whenever you’ve added links in <NuxtLink :to="`/sites/${siteId}/settings`">Settings</NuxtLink>.</p>
                </section>
            </div>

            <section aria-label="Layout preview" class="preview-col">
                <span class="muted">Preview. Hover a header link with links under it to see its dropdown.</span>
                <div class="preview" :style="siteThemeVars(theme)">
                    <SiteHeader :name="site?.name ?? ''" :items="menus?.header ?? []" :theme="theme" :socials="(site?.socials as SiteSocials)" preview />
                    <BlockRenderer :blocks="sample" />
                    <SiteFooter :name="site?.name ?? ''" :items="menus?.footer ?? []" :legal="menus?.legal ?? []" :theme="theme" :socials="(site?.socials as SiteSocials)" preview />
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
.head { align-items: center; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 17px; margin: 0; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.err { color: var(--danger); font-size: 14px; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: -12px 0 0; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 400px) minmax(0, 1fr); }
.controls { display: flex; flex-direction: column; gap: 20px; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.lb { display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.cards { display: grid; gap: 10px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cards.two-up { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.card { background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius-lg); color: var(--quarry); cursor: pointer; display: flex; flex-direction: column; font: inherit; gap: 4px; padding: 10px; text-align: left; }
.card .muted { font-size: 12px; line-height: 1.35; }
.card.on { border-color: var(--quarry); box-shadow: 0 0 0 1px var(--quarry); }
.card:disabled { cursor: default; }
.sketch { align-items: center; background: var(--paper); border-radius: 4px; display: flex; gap: 4px; height: 34px; margin-bottom: 4px; padding: 0 8px; }
.sketch i { background: #c3c8d1; border-radius: 2px; height: 4px; width: 12px; }
.sketch .lg { background: var(--quarry); height: 8px; margin-right: auto; width: 22px; }
.sketch.centred { flex-wrap: wrap; justify-content: center; padding: 4px 8px; }
.sketch.centred .lg { flex-basis: 100%; margin: 0 auto; max-width: 22px; }
.sketch.mega { position: relative; }
.sketch.mega::after { background: #dde1e7; border-radius: 2px; bottom: -6px; content: ''; height: 10px; left: 30%; position: absolute; right: 6px; }
.swatches { display: flex; flex-wrap: wrap; gap: 8px; }
.sw { align-items: center; background: var(--white); border: 1.5px solid var(--line); border-radius: 999px; cursor: pointer; display: inline-flex; font: inherit; font-size: 13px; font-weight: 600; gap: 6px; padding: 4px 10px 4px 4px; }
.sw i { border: 1px solid rgb(0 0 0 / 15%); border-radius: 50%; display: block; height: 22px; width: 22px; }
.sw.on { border-color: var(--quarry); box-shadow: 0 0 0 1px var(--quarry); }
.check { align-items: center; display: flex; font-size: 14px; gap: 8px; }
.preview-col { display: flex; flex-direction: column; gap: 8px; position: sticky; top: 16px; }
.preview { border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line), 0 8px 24px rgb(46 52 69 / 8%); overflow: hidden; }
@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } .preview-col { position: static; } .cards { grid-template-columns: minmax(0, 1fr); } }
.img-row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }
.logo-prev { border-radius: 4px; height: 40px; max-width: 200px; object-fit: contain; padding: 6px; }
</style>
