<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()

const [{ data: site, refresh: refreshSite }, { data: menus }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`menus-${siteId}`, () => fetcher(`/api/sites/${siteId}/menus`))
])

const saved = ref<Required<SiteTheme>>({ ...DEFAULT_THEME, ...(site.value?.theme as SiteTheme) })
const theme = ref<Required<SiteTheme>>({ ...saved.value })
const dirty = computed(() => JSON.stringify(theme.value) !== JSON.stringify(saved.value))
const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')

useHead(() => ({
    title: 'Theme · Slate',
    link: [{ rel: 'stylesheet', href: themeFontsHref(theme.value) }]
}))

const colours: { key: 'primary' | 'dark' | 'soft' | 'text' | 'background' | 'accent', name: string, help: string }[] = [
    { key: 'primary', name: 'Main', help: 'Buttons, links and highlights' },
    { key: 'accent', name: 'Accent', help: 'Small touches: underlines, labels' },
    { key: 'dark', name: 'Dark', help: 'Headings and dark sections' },
    { key: 'soft', name: 'Soft', help: 'Light section backgrounds' },
    { key: 'text', name: 'Text', help: 'Paragraphs' },
    { key: 'background', name: 'Page', help: 'Main background' }
]
const corners = [
    { key: 'square', label: 'Square' },
    { key: 'soft', label: 'Slightly rounded' },
    { key: 'round', label: 'Round' }
] as const

// Presets change colours, fonts and corners only; logo, sizes and layout stay as they are
function applyPreset(preset: SiteTheme) {
    theme.value = { ...theme.value, ...preset }
    for (const key of ['headingFont', 'bodyFont'] as const) {
        const f = findGoogleFont(theme.value[key])
        if (f) setFont(key, f)
    }
}
const sizes = [{ key: 'small', label: 'Small' }, { key: 'medium', label: 'Medium' }, { key: 'large', label: 'Large' }, { key: 'huge', label: 'Huge' }] as const
const navSizes = [{ key: 'small', label: 'Small' }, { key: 'medium', label: 'Medium' }, { key: 'large', label: 'Large' }] as const
const cases = [{ key: 'none', label: 'As typed' }, { key: 'capitalize', label: 'Title Case' }, { key: 'uppercase', label: 'CAPITALS' }] as const
const caseFields = [{ key: 'headingCase', label: 'Headings' }, { key: 'navCase', label: 'Menu links' }, { key: 'buttonCase', label: 'Buttons' }] as const

function setHex(key: typeof colours[number]['key'], value: string) {
    const v = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`
    if (/^#[0-9a-f]{6}$/i.test(v)) theme.value[key] = v.toUpperCase()
}

async function save() {
    status.value = 'saving'
    try {
        const res = await $fetch<SiteTheme>(`/api/sites/${siteId}/theme`, { method: 'PUT', body: theme.value })
        saved.value = { ...DEFAULT_THEME, ...res }
        theme.value = { ...saved.value }
        status.value = 'saved'
        await refreshSite()
    } catch {
        status.value = 'error'
    }
}

const sample: Block[] = [
    { id: 's1', type: 'hero', props: { heading: 'A headline that says what you do', text: 'A sentence or two underneath, in your paragraph colour and font.', buttonLabel: 'Get in touch', buttonUrl: '' } },
    { id: 's2', type: 'services', props: { heading: 'What we do', intro: '', items: [{ title: 'First service', text: 'Short description.' }, { title: 'Second service', text: 'Short description.' }, { title: 'Third service', text: 'Short description.' }] } },
    { id: 's3', type: 'cta', props: { heading: 'Ready to start?', text: '', buttonLabel: 'Book a call', buttonUrl: '' } }
]

function setFont(key: 'headingFont' | 'bodyFont', f: GoogleFont) {
    theme.value[key] = f.name
    theme.value[`${key}Css`] = fontCss(f)
    theme.value[`${key}Kind`] = f.kind
}
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Theme</h1>
            <div class="row">
                <span v-if="status === 'saved' && !dirty" class="muted" role="status">Saved. Your live site uses the new theme now.</span>
                <span v-if="status === 'error'" class="err" role="alert">Couldn’t save. Check your connection and try again.</span>
                <button class="btn btn-ghost" type="button" :disabled="!dirty" @click="theme = { ...saved }">Discard changes</button>
                <button class="btn btn-dark" type="button" :disabled="!dirty || status === 'saving'" @click="save">{{ status === 'saving' ? 'Saving…' : 'Save theme' }}</button>
            </div>
        </div>

        <div class="two">
            <div class="controls">
                <section class="panel box" aria-labelledby="pr-h">
                    <h2 id="pr-h">Start from a palette</h2>
                    <div class="presets">
                        <button v-for="p in THEME_PRESETS" :key="p.name" type="button" class="preset" @click="applyPreset(p.theme)">
                            <span class="swatches" aria-hidden="true">
                                <i :style="{ background: p.theme.primary }" /><i :style="{ background: p.theme.dark }" /><i :style="{ background: p.theme.soft }" />
                            </span>
                            {{ p.name }}
                        </button>
                    </div>
                </section>

                <section class="panel box" aria-labelledby="b-h">
                    <h2 id="b-h">Logo and icon</h2>
                    <div class="field">
                        <span class="lb">Logo</span>
                        <div class="img-row">
                            <img v-if="theme.logo" :src="theme.logo" alt="" class="logo-prev">
                            <span v-else class="muted">No logo yet. Your site name shows instead.</span>
                            <MediaPicker :site-id="siteId" @pick="theme.logo = $event.url" />
                            <button v-if="theme.logo" class="btn btn-plain btn-sm" type="button" @click="theme.logo = ''">Remove</button>
                        </div>
                    </div>
                    <div v-if="theme.logo" class="field">
                        <span class="lb">Logo for dark backgrounds (optional)</span>
                        <div class="img-row">
                            <img v-if="theme.logoOnDark" :src="theme.logoOnDark" alt="" class="logo-prev dark">
                            <span v-else class="muted">Used on a dark or coloured header or footer, e.g. a white version.</span>
                            <MediaPicker :site-id="siteId" @pick="theme.logoOnDark = $event.url" />
                            <button v-if="theme.logoOnDark" class="btn btn-plain btn-sm" type="button" @click="theme.logoOnDark = ''">Remove</button>
                        </div>
                    </div>
                    <div v-if="theme.logo" class="field">
                        <label for="lh">Logo height: {{ theme.logoHeight }}px</label>
                        <input id="lh" v-model.number="theme.logoHeight" type="range" min="20" max="96" step="2">
                    </div>
                    <div class="field">
                        <span class="lb">Browser tab icon (favicon)</span>
                        <div class="img-row">
                            <img v-if="theme.favicon" :src="theme.favicon" alt="" class="fav-prev">
                            <span v-else class="muted">None</span>
                            <MediaPicker :site-id="siteId" @pick="theme.favicon = $event.url" />
                            <button v-if="theme.favicon" class="btn btn-plain btn-sm" type="button" @click="theme.favicon = ''">Remove</button>
                        </div>
                        <span class="help">A square image works best, at least 64 × 64.</span>
                    </div>
                </section>

                <section class="panel box" aria-labelledby="c-h">
                    <h2 id="c-h">Colours</h2>
                    <div class="field">
                        <span class="lb">Light or dark</span>
                        <div class="seg" role="group" aria-label="Light or dark">
                            <button type="button" :class="{ on: theme.scheme === 'light' }" :aria-pressed="theme.scheme === 'light'" @click="theme.scheme = 'light'">Light</button>
                            <button type="button" :class="{ on: theme.scheme === 'dark' }" :aria-pressed="theme.scheme === 'dark'" @click="theme.scheme = 'dark'">Dark</button>
                        </div>
                        <span v-if="theme.scheme === 'dark'" class="help">Your Dark colour becomes the page background, with light text.</span>
                    </div>
                    <div v-for="c in colours" :key="c.key" class="colour">
                        <label class="swatch" :style="{ background: theme[c.key] }">
                            <span class="visually-hidden">Change {{ c.name }} colour</span>
                            <input v-model="theme[c.key]" type="color">
                        </label>
                        <span class="c-text"><b>{{ c.name }}</b><span class="muted">{{ c.help }}</span></span>
                        <input class="hex" type="text" :value="theme[c.key]" :aria-label="`${c.name} colour code`" maxlength="7" @change="setHex(c.key, ($event.target as HTMLInputElement).value)">
                    </div>
                </section>

                <section class="panel box" aria-labelledby="t-h">
                    <h2 id="t-h">Text and shapes</h2>
                    <FontPicker id="fh" label="Headings font" :model-value="theme.headingFont" @pick="setFont('headingFont', $event)" />
                    <FontPicker id="fb" label="Paragraphs font" :model-value="theme.bodyFont" @pick="setFont('bodyFont', $event)" />
                    <div class="field">
                        <span class="lb">Page titles (the big heading at the top)</span>
                        <div class="seg" role="group" aria-label="Page title size">
                            <button v-for="z in sizes" :key="z.key" type="button" :class="{ on: theme.titleSize === z.key }" :aria-pressed="theme.titleSize === z.key" @click="theme.titleSize = z.key">{{ z.label }}</button>
                        </div>
                    </div>
                    <div class="field">
                        <span class="lb">Section headings</span>
                        <div class="seg" role="group" aria-label="Section heading size">
                            <button v-for="z in sizes" :key="z.key" type="button" :class="{ on: theme.headingSize === z.key }" :aria-pressed="theme.headingSize === z.key" @click="theme.headingSize = z.key">{{ z.label }}</button>
                        </div>
                    </div>
                    <div class="field">
                        <span class="lb">Menu links</span>
                        <div class="seg" role="group" aria-label="Menu link size">
                            <button v-for="z in navSizes" :key="z.key" type="button" :class="{ on: theme.navSize === z.key }" :aria-pressed="theme.navSize === z.key" @click="theme.navSize = z.key">{{ z.label }}</button>
                        </div>
                    </div>
                    <div v-for="cf in caseFields" :key="cf.key" class="field">
                        <span class="lb">{{ cf.label }} lettering</span>
                        <div class="seg" role="group" :aria-label="`${cf.label} lettering`">
                            <button v-for="c in cases" :key="c.key" type="button" :class="{ on: theme[cf.key] === c.key }" :aria-pressed="theme[cf.key] === c.key" @click="theme[cf.key] = c.key">{{ c.label }}</button>
                        </div>
                    </div>
                    <div class="field">
                        <span class="lb">Button corners</span>
                        <div class="seg" role="group" aria-label="Button corners">
                            <button v-for="c in corners" :key="c.key" type="button" :class="{ on: theme.corners === c.key }" :aria-pressed="theme.corners === c.key" @click="theme.corners = c.key">{{ c.label }}</button>
                        </div>
                    </div>
                </section>
            </div>

            <section aria-label="Theme preview" class="preview-col">
                <span class="muted">Preview, updates as you change the theme</span>
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
h2 { font-size: 18px; margin: 0; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.err { color: var(--danger); font-size: 14px; }

.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
.controls { display: flex; flex-direction: column; gap: 20px; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }

.presets { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
.preset { align-items: center; background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius-lg); color: var(--quarry); cursor: pointer; display: flex; font-family: inherit; font-size: 14px; font-weight: 600; gap: 10px; padding: 10px; text-align: left; }
.preset:hover { border-color: var(--quarry); }
.swatches { display: flex; }
.swatches i { border: 2px solid var(--white); border-radius: 50%; display: block; height: 22px; margin-left: -6px; width: 22px; }
.swatches i:first-child { margin-left: 0; }

.colour { align-items: center; border-top: 1px solid var(--line-soft); display: flex; gap: 12px; padding-top: 12px; }
.swatch { border-radius: var(--radius); box-shadow: inset 0 0 0 1px rgb(46 52 69 / 15%); cursor: pointer; flex: none; height: 40px; position: relative; width: 40px; }
.swatch input { cursor: pointer; height: 100%; inset: 0; opacity: 0; position: absolute; width: 100%; }
.swatch:focus-within { outline: 3px solid var(--lichen); outline-offset: 2px; }
.c-text { display: flex; flex: 1; flex-direction: column; }
.c-text b { font-size: 15px; font-weight: 600; }
.hex { border: 1.5px solid var(--line); border-radius: var(--radius); color: var(--text-body); font-family: ui-monospace, monospace; font-size: 13px; height: 34px; padding: 0 8px; width: 92px; }
.hex:focus { border-color: var(--quarry); outline: none; }

.field label, .lb { font-size: 14px; font-weight: 600; }
.inp { font-size: 15px; height: 42px; }
.seg { align-self: flex-start; background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }

.preview-col { display: flex; flex-direction: column; gap: 10px; position: sticky; top: 24px; }
.preview { background: var(--site-bg); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line), 0 12px 32px rgb(46 52 69 / 10%); color: var(--site-text); font-family: var(--site-body-font); overflow: hidden; pointer-events: none; }
.preview :deep(.blk) { padding: 44px 0; }
.preview :deep(.hero h1) { font-size: 38px; }

@media (max-width: 1100px) {
    .two { grid-template-columns: minmax(0, 1fr); }
    .preview-col { position: static; }
}
.img-row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.logo-prev.dark { background: var(--quarry); }
.logo-prev { background: var(--mist); border-radius: 4px; height: 40px; max-width: 180px; object-fit: contain; padding: 4px; }
.fav-prev { border-radius: 4px; height: 32px; object-fit: cover; width: 32px; }
input[type="range"] { width: 100%; }
</style>
