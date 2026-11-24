<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

interface SeoPage { id: string, title: string, path: string, status: PageStatus, seoTitle: string | null, seoDescription: string | null, shareImage: string | null, noIndex: boolean }
const { data, refresh } = await useAsyncData(`seo-${siteId}`, () => fetcher<{ siteName: string, address: string, seo: SiteSeo, pages: SeoPage[] }>(`/api/sites/${siteId}/seo`))
useHead({ title: 'Search and sharing · Slate' })

const role = computed(() => me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer')
const canEdit = computed(() => ROLE_RANK[role.value] >= ROLE_RANK.editor)
const canEditDefaults = computed(() => ROLE_RANK[role.value] >= ROLE_RANK.admin)

const defaults = reactive<SiteSeo>({ ...data.value?.seo })
const hasDefaultImage = computed(() => !!data.value?.seo.defaultShareImage)

// A page counts as missing something if it has no description or no share image (and no site default covers it)
const missing = (p: SeoPage) => ({
    description: !p.seoDescription && !data.value?.seo.defaultDescription,
    image: !p.shareImage && !hasDefaultImage.value
})
const needsWork = computed(() => (data.value?.pages ?? []).filter(p => !p.noIndex && (missing(p).description || missing(p).image)))

const selectedId = ref<string | null>(needsWork.value[0]?.id ?? data.value?.pages[0]?.id ?? null)
const selected = computed(() => data.value?.pages.find(p => p.id === selectedId.value) ?? null)
const draft = reactive({ seoTitle: '', seoDescription: '', shareImage: '', noIndex: false })
watch(selected, (p) => {
    draft.seoTitle = p?.seoTitle ?? ''
    draft.seoDescription = p?.seoDescription ?? ''
    draft.shareImage = p?.shareImage ?? ''
    draft.noIndex = p?.noIndex ?? false
}, { immediate: true })

const dirty = computed(() => !!selected.value && (
    draft.seoTitle !== (selected.value.seoTitle ?? '')
    || draft.seoDescription !== (selected.value.seoDescription ?? '')
    || draft.shareImage !== (selected.value.shareImage ?? '')
    || draft.noIndex !== selected.value.noIndex))
const defaultsDirty = computed(() => JSON.stringify(cleanSiteSeo(defaults)) !== JSON.stringify(data.value?.seo ?? {}))

const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
async function save() {
    status.value = 'saving'
    try {
        if (dirty.value && selected.value) {
            await $fetch(`/api/sites/${siteId}/pages/${selected.value.id}`, {
                method: 'PATCH',
                body: { seoTitle: draft.seoTitle || null, seoDescription: draft.seoDescription || null, shareImage: draft.shareImage || null, noIndex: draft.noIndex }
            })
        }
        if (defaultsDirty.value && canEditDefaults.value) {
            await $fetch(`/api/sites/${siteId}/seo`, { method: 'PUT', body: defaults })
        }
        await refresh()
        status.value = 'saved'
    } catch {
        status.value = 'error'
    }
}

const previewTitle = computed(() => selected.value && data.value
    ? fullTitle({ title: selected.value.title, seoTitle: draft.seoTitle, path: selected.value.path }, data.value.siteName, { ...data.value.seo, ...cleanSiteSeo(defaults) })
    : '')
const previewDescription = computed(() => draft.seoDescription || cleanSiteSeo(defaults).defaultDescription || '')
const breadcrumb = computed(() => selected.value && data.value ? `${data.value.address}${selected.value.path === '/' ? '' : ` › ${selected.value.path.slice(1).split('/').join(' › ')}`}` : '')
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Search and sharing</h1>
            <div class="row">
                <span v-if="status === 'saved' && !dirty && !defaultsDirty" class="muted" role="status">Saved. It’s live now.</span>
                <span v-if="status === 'error'" class="err" role="alert">Couldn’t save. Please try again.</span>
                <button v-if="canEdit" class="btn btn-dark" type="button" :disabled="(!dirty && !defaultsDirty) || status === 'saving'" @click="save">{{ status === 'saving' ? 'Saving…' : 'Save changes' }}</button>
            </div>
        </div>

        <div v-if="needsWork.length" class="banner">
            <span class="ring" aria-hidden="true" />
            <span><b>{{ needsWork.length }} {{ needsWork.length === 1 ? 'page is' : 'pages are' }} missing something.</b> Pages with a description and share image look better in Google and when someone shares a link.</span>
        </div>
        <div v-else class="banner ok">
            <span class="tick" aria-hidden="true">✓</span>
            <span><b>Every page has a description and share image.</b></span>
        </div>

        <div class="two">
            <div class="left">
                <section class="panel scroll" aria-label="Pages">
                    <table class="tbl">
                        <thead><tr><th scope="col">Page</th><th scope="col">Title</th><th scope="col">Description</th><th scope="col">Share image</th></tr></thead>
                        <tbody>
                            <tr v-for="p in data?.pages" :key="p.id" :class="{ sel: p.id === selectedId }">
                                <td><button type="button" class="pick" :aria-pressed="p.id === selectedId" @click="selectedId = p.id">{{ p.title }}</button><span v-if="p.noIndex" class="muted"> · hidden</span></td>
                                <td><StatusDot :ok="true" :label="p.seoTitle ? 'Custom' : 'Page title'" /></td>
                                <td><StatusDot :ok="!missing(p).description" :label="p.seoDescription ? 'Added' : missing(p).description ? 'Missing' : 'Site default'" /></td>
                                <td><StatusDot :ok="!missing(p).image" :label="p.shareImage ? 'Added' : missing(p).image ? 'Missing' : 'Site default'" /></td>
                            </tr>
                        </tbody>
                    </table>
                </section>

                <section class="panel box" aria-labelledby="d-h">
                    <h2 id="d-h">Whole site</h2>
                    <div class="field">
                        <label for="sd-suffix">Ending added to every title</label>
                        <input id="sd-suffix" v-model="defaults.titleSuffix" class="inp" type="text" :placeholder="data?.siteName" maxlength="80" :disabled="!canEditDefaults">
                        <span class="help">e.g. “{{ data?.siteName }}, Bristol”. Leave empty to use your site name.</span>
                    </div>
                    <div class="field">
                        <label for="sd-desc">Description for pages without one</label>
                        <textarea id="sd-desc" v-model="defaults.defaultDescription" class="inp" rows="3" maxlength="320" :disabled="!canEditDefaults" />
                    </div>
                    <div class="field">
                        <label for="sd-img">Share image for pages without one</label>
                        <input id="sd-img" v-model="defaults.defaultShareImage" class="inp" type="text" placeholder="https://…" :disabled="!canEditDefaults">
                        <span class="help">Paste an image address for now. Best at 1200 × 630 pixels.</span>
                    </div>
                </section>
            </div>

            <section v-if="selected" class="panel box" aria-labelledby="s-h">
                <h2 id="s-h">{{ selected.title }}</h2>
                <div class="field">
                    <label for="st">Title in search results</label>
                    <input id="st" v-model="draft.seoTitle" class="inp" type="text" :placeholder="selected.title" maxlength="120" :disabled="!canEdit">
                    <span class="help" :class="{ warn: previewTitle.length > SEO_TITLE_MAX }">{{ previewTitle.length }} of {{ SEO_TITLE_MAX }} characters{{ previewTitle.length > SEO_TITLE_MAX ? '. Google may cut the end off.' : '' }}</span>
                </div>
                <div class="field">
                    <label for="sdesc">Description</label>
                    <textarea id="sdesc" v-model="draft.seoDescription" class="inp" rows="4" placeholder="A sentence or two about this page" maxlength="320" :disabled="!canEdit" />
                    <span v-if="!draft.seoDescription && !defaults.defaultDescription" class="help warn">Add a description. Google shows it under your title.</span>
                    <span v-else class="help" :class="{ warn: draft.seoDescription.length > SEO_DESCRIPTION_MAX }">{{ draft.seoDescription.length }} of {{ SEO_DESCRIPTION_MAX }} characters</span>
                </div>
                <div class="field">
                    <label for="simg">Share image</label>
                    <input id="simg" v-model="draft.shareImage" class="inp" type="text" placeholder="https://…" :disabled="!canEdit">
                    <span class="help">Shown when someone posts a link to this page. Choosing from Media comes with the media library.</span>
                </div>

                <div class="google">
                    <span class="muted">How it could look in Google</span>
                    <span class="g-url">{{ breadcrumb }}</span>
                    <span class="g-title">{{ previewTitle }}</span>
                    <span class="g-desc" :class="{ none: !previewDescription }">{{ previewDescription || 'No description yet' }}</span>
                </div>

                <label class="check"><input v-model="draft.noIndex" type="checkbox" :disabled="!canEdit">Hide this page from search engines</label>
                <span class="muted">Changes here go live as soon as you save. You don’t need to publish the page again.</span>
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
.banner { align-items: center; background: #fff6e6; border-radius: var(--radius-lg); box-shadow: inset 0 0 0 1px #f2d7a6; display: flex; gap: 14px; padding: 16px 20px; }
.banner span:last-child { color: var(--text-body); }
.banner b { color: var(--quarry); }
.banner.ok { background: #e9f3ee; box-shadow: inset 0 0 0 1px #bcdccb; }
.ring { border: 2px solid var(--lichen); border-radius: 50%; flex: none; height: 20px; width: 20px; }
.tick { color: var(--ok-text); font-weight: 800; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
.left { display: flex; flex-direction: column; gap: 24px; }
.scroll { overflow-x: auto; }
.tbl { min-width: 520px; }
.tbl tr.sel td { background: #fff6e6; }
.pick { background: none; border: 0; color: var(--quarry); cursor: pointer; font: inherit; font-weight: 600; padding: 0; text-align: left; }
.pick:hover { text-decoration: underline; }
.box { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
.field label { font-size: 14px; }
.inp { font-size: 15px; height: 42px; }
textarea.inp { height: auto; line-height: 1.5; padding: 10px 12px; resize: vertical; }
.help.warn { color: var(--warn-text); }
.google { background: var(--paper); border-radius: var(--radius); display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; }
.g-url { color: var(--text-body); font-size: 13px; }
.g-title { color: #1a4fb3; font-size: 18px; }
.g-desc { color: var(--text-muted); font-size: 14px; line-height: 1.5; }
.g-desc.none { font-style: italic; }
.check { align-items: center; display: flex; font-size: 15px; gap: 10px; }
.check input { accent-color: var(--quarry); height: 18px; width: 18px; }
@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
