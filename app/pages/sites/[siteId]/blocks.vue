<script setup lang="ts">
// Every block, to try out with sample content before putting it on a page. Nothing here is saved
// unless you press "Add to a page".
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

const [{ data: site }, { data: pages }, { data: forms }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`)),
    useAsyncData(`forms-${siteId}`, () => fetcher<FormDefinition[]>(`/api/sites/${siteId}/forms`))
])
const theme = computed(() => (site.value?.theme ?? {}) as SiteTheme)
useHead(() => ({ title: 'Blocks · Slate', link: [{ rel: 'stylesheet', href: themeFontsHref(theme.value) }] }))
const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.editor)

// Blocks render as they would on the site, with links switched off
provide('blockPreview', true)
provide('siteSocials', computed(() => ((site.value as { socials?: SiteSocials } | null)?.socials ?? {}) as SiteSocials))
provide('siteProjects', ref([]))
provide('siteForms', computed(() => Object.fromEntries((forms.value ?? []).map(f => [f.id, f]))))
provide('siteIntegrations', computed(() => (site.value?.integrations ?? {}) as SiteIntegrations))
provide('sitePosts', ref([
    { title: 'How to choose a fabric that lasts', slug: 'a', summary: 'Linen, velvet or wool? What holds up to everyday life.', coverImage: null, publishedAt: new Date().toISOString(), category: { name: 'Advice' } },
    { title: 'Behind the scenes in the workshop', slug: 'b', summary: 'A week in the life of a chair being brought back to life.', coverImage: null, publishedAt: new Date(Date.now() - 6 * 86400000).toISOString(), category: null },
    { title: 'Five signs your sofa needs re-springing', slug: 'c', summary: 'Saggy seats? It may not need replacing.', coverImage: null, publishedAt: new Date(Date.now() - 20 * 86400000).toISOString(), category: { name: 'Advice' } }
]))

// A playground copy of each block, so edits here never touch a real page
const playground = reactive<Record<string, Block>>({})
const blockFor = (type: string) => {
    if (!playground[type]) {
        const b = newBlock(type)
        if (type === 'form' && forms.value?.[0]) b.props.formId = forms.value[0].id
        playground[type] = b
    }
    return playground[type]
}
const selectedType = ref<string>(typeof route.query.block === 'string' && findBlockType(route.query.block) ? route.query.block : BLOCK_TYPES[0]!.type)
const selected = computed(() => blockFor(selectedType.value))
const def = computed(() => findBlockType(selectedType.value)!)
const device = ref<'desktop' | 'phone'>('desktop')
const reset = () => {
    delete playground[selectedType.value]
    blockFor(selectedType.value)
}
const linkTargets = computed(() => (pages.value ?? []).map(p => ({ title: p.title, path: p.path })))

// Add the tried-out block (with its current content) to the end of a page's draft
const targetPage = ref<string>('')
const adding = ref(false)
const added = ref<{ id: string, title: string } | null>(null)
const addError = ref('')
async function addToPage() {
    if (!targetPage.value) return
    adding.value = true
    addError.value = ''
    try {
        const page = await $fetch<{ blocks: Block[] }>(`/api/sites/${siteId}/pages/${targetPage.value}`)
        const copy = { ...structuredClone(toRaw(selected.value)), id: crypto.randomUUID() }
        await $fetch(`/api/sites/${siteId}/pages/${targetPage.value}`, { method: 'PATCH', body: { blocks: [...page.blocks, copy] } })
        added.value = { id: targetPage.value, title: pages.value?.find(p => p.id === targetPage.value)?.title ?? 'the page' }
    } catch (err) {
        addError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t add it. Please try again.'
    } finally {
        adding.value = false
    }
}
watch(selectedType, () => {
    added.value = null
    navigateTo({ query: { block: selectedType.value } }, { replace: true })
})
</script>

<template>
    <div class="page">
        <div class="head"><h1>Blocks</h1></div>
        <p class="lead">Every block you can put on a page. Pick one to see it in your theme, change its words to try it out, then add it to a page. Nothing here changes your site until you do.</p>

        <div class="three">
            <nav class="panel cat" aria-label="Blocks">
                <div v-for="g in BLOCK_GROUPS" :key="g" class="cat-group">
                    <span class="cat-title">{{ g }}</span>
                    <button v-for="b in BLOCK_TYPES.filter(x => x.group === g)" :key="b.type" type="button" class="cat-item" :class="{ on: selectedType === b.type }" :aria-pressed="selectedType === b.type" @click="selectedType = b.type">
                        <b>{{ b.name }}</b>
                        <span class="muted">{{ b.desc }}</span>
                    </button>
                </div>
            </nav>

            <section class="stage" :aria-label="`${def.name} preview`">
                <div class="stage-bar">
                    <b>{{ def.name }}</b>
                    <div class="seg" role="group" aria-label="Preview size">
                        <button type="button" :class="{ on: device === 'desktop' }" :aria-pressed="device === 'desktop'" @click="device = 'desktop'">Desktop</button>
                        <button type="button" :class="{ on: device === 'phone' }" :aria-pressed="device === 'phone'" @click="device = 'phone'">Phone</button>
                    </div>
                </div>
                <div class="canvas" :class="device" :style="siteThemeVars(theme)">
                    <BlockView :key="selected.id" :block="selected" />
                </div>
            </section>

            <aside class="panel side" aria-label="Try it out">
                <div class="side-head">
                    <b>Try it out</b>
                    <button class="btn btn-plain btn-sm" type="button" @click="reset">Reset</button>
                </div>
                <BlockInspector :key="selected.id" :block="selected" :pages="linkTargets" :forms="forms ?? []" :site-id="siteId" @change="() => {}" />
                <div v-if="canEdit" class="add">
                    <label for="add-page">Add this block to</label>
                    <div class="add-row">
                        <select id="add-page" v-model="targetPage" class="inp">
                            <option value="" disabled>Choose a page…</option>
                            <option v-for="p in pages" :key="p.id" :value="p.id">{{ p.title }} ({{ p.path }})</option>
                        </select>
                        <button class="btn btn-dark btn-sm" type="button" :disabled="!targetPage || adding" @click="addToPage">{{ adding ? 'Adding…' : 'Add' }}</button>
                    </div>
                    <p v-if="added" class="ok" role="status">Added to the end of {{ added.title }} as a draft. <NuxtLink :to="`/sites/${siteId}/pages/${added.id}`">Open it in the editor</NuxtLink> to move it and publish.</p>
                    <p v-if="addError" class="err" role="alert">{{ addError }}</p>
                </div>
            </aside>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: -8px 0 0; max-width: 52em; }
.three { align-items: start; display: grid; gap: 20px; grid-template-columns: 240px minmax(0, 1fr) 320px; }
.cat { display: flex; flex-direction: column; gap: 14px; max-height: calc(100vh - 140px); overflow: auto; padding: 12px; position: sticky; top: 16px; }
.cat-group { display: flex; flex-direction: column; gap: 4px; }
.cat-title { color: var(--text-muted); font-size: 12px; font-weight: 700; padding: 0 6px; }
.cat-item { background: none; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: flex; flex-direction: column; font: inherit; gap: 1px; padding: 8px 10px; text-align: left; }
.cat-item b { font-size: 14px; }
.cat-item .muted { font-size: 12px; line-height: 1.35; }
.cat-item:hover { background: var(--mist); }
.cat-item.on { background: #eef1f7; box-shadow: inset 3px 0 0 var(--quarry); }
.stage { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
.stage-bar { align-items: center; display: flex; justify-content: space-between; }
.seg { background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font: inherit; font-size: 13px; font-weight: 600; height: 30px; padding: 0 10px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }
.canvas { background: var(--site-bg); border-radius: var(--radius-lg); box-shadow: 0 0 0 1px var(--line), 0 8px 24px rgb(46 52 69 / 8%); margin: 0 auto; overflow: hidden; width: 100%; }
.canvas.phone { max-width: 390px; }
.side { display: flex; flex-direction: column; gap: 14px; padding: 16px; position: sticky; top: 16px; }
.side-head { align-items: center; display: flex; justify-content: space-between; }
.add { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 8px; padding-top: 14px; }
.add label { font-size: 14px; font-weight: 600; }
.add-row { display: flex; gap: 8px; }
.add-row .inp { flex: 1; font-size: 14px; height: 36px; min-width: 0; }
.ok { color: var(--ok-text); font-size: 13px; margin: 0; }
.err { color: var(--danger); font-size: 13px; margin: 0; }
@media (max-width: 1200px) { .three { grid-template-columns: 220px minmax(0, 1fr); } .side { grid-column: 1 / -1; position: static; } }
@media (max-width: 800px) { .three { grid-template-columns: minmax(0, 1fr); } .cat { max-height: none; position: static; } }
</style>
