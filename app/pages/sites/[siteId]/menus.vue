<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()

const [{ data: site }, { data: loadedMenus, refresh }, { data: pages }] = await Promise.all([
    useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`)),
    useAsyncData(`menus-${siteId}`, () => fetcher(`/api/sites/${siteId}/menus`)),
    useAsyncData(`pages-${siteId}`, () => fetcher<PageListItem[]>(`/api/sites/${siteId}/pages`))
])
useHead({ title: 'Menus · Slate' })

const slot = ref<MenuSlot>('header')
const drafts = reactive<Record<MenuSlot, MenuItem[]>>({
    header: structuredClone(toRaw(loadedMenus.value?.header ?? [])),
    footer: structuredClone(toRaw(loadedMenus.value?.footer ?? [])),
    legal: structuredClone(toRaw(loadedMenus.value?.legal ?? []))
})
const savedJson = reactive<Record<MenuSlot, string>>({
    header: loadedMenus.value?.headerIsAuto ? '' : JSON.stringify(drafts.header),
    footer: JSON.stringify(drafts.footer),
    legal: JSON.stringify(drafts.legal)
})

const items = computed(() => drafts[slot.value])
const dirty = computed(() => JSON.stringify(items.value) !== savedJson[slot.value])
const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find(i => i.id === selectedId.value) ?? null)
const status = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const slotInfo = computed(() => MENU_SLOTS.find(s => s.slot === slot.value)!)

watch(slot, () => {
    selectedId.value = null
    status.value = 'idle'
})

// "Goes to": one of the site's pages, or a typed address
const pageByPath = computed(() => new Map((pages.value ?? []).map(p => [p.path, p])))
const target = computed({
    get: () => selected.value && pageByPath.value.has(selected.value.url) ? selected.value.url : '__other',
    set: (v: string) => {
        if (!selected.value) return
        if (v !== '__other') {
            selected.value.url = v
            if (!selected.value.label) selected.value.label = pageByPath.value.get(v)?.title ?? ''
        } else {
            selected.value.url = ''
        }
    }
})

function describe(item: MenuItem) {
    const page = pageByPath.value.get(item.url)
    const where = page ? `Page: ${page.title}` : item.url || 'No link yet'
    return item.button ? `${where}, shown as a button` : where
}

function addLink() {
    const first = (pages.value ?? []).find(p => p.path !== '/' && !items.value.some(i => i.url === p.path))
    const item: MenuItem = { id: crypto.randomUUID(), label: first?.title ?? 'New link', url: first?.path ?? '/', depth: 0 }
    items.value.push(item)
    selectedId.value = item.id
}

function move(i: number, dir: -1 | 1) {
    moveTo(i, i + dir)
}
function moveTo(from: number, to: number) {
    const list = items.value
    moveInPlace(list, from, to)
    if (list[0]) list[0].depth = 0
}
const dr = useDragReorder(moveTo)

function remove(id: string) {
    drafts[slot.value] = items.value.filter(i => i.id !== id)
    if (drafts[slot.value][0]) drafts[slot.value][0]!.depth = 0
    selectedId.value = null
}

async function save() {
    status.value = 'saving'
    try {
        const res = await $fetch<MenuItem[]>(`/api/sites/${siteId}/menus/${slot.value}`, { method: 'PUT', body: { items: items.value } })
        drafts[slot.value] = res
        savedJson[slot.value] = JSON.stringify(res)
        status.value = 'saved'
        await refresh()
    } catch {
        status.value = 'error'
    }
}

const themeVars = computed(() => siteThemeVars(site.value?.theme as SiteTheme))
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Menus</h1>
            <div class="row">
                <span v-if="status === 'saved' && !dirty" class="muted" role="status">Saved. It’s on your live site now.</span>
                <span v-if="status === 'error'" class="err" role="alert">Couldn’t save. Links need text and somewhere to go.</span>
                <button class="btn btn-dark" type="button" :disabled="!dirty || status === 'saving'" @click="save">{{ status === 'saving' ? 'Saving…' : 'Save menu' }}</button>
            </div>
        </div>

        <div class="seg" role="group" aria-label="Choose menu">
            <button v-for="s in MENU_SLOTS" :key="s.slot" type="button" :class="{ on: slot === s.slot }" :aria-pressed="slot === s.slot" @click="slot = s.slot">{{ s.name }}</button>
        </div>

        <p v-if="slot === 'header' && loadedMenus?.headerIsAuto" class="note">
            Your header lists your top-level pages automatically. Change anything and save to set it yourself.
        </p>

        <div class="two">
            <section class="panel box" aria-labelledby="m-h">
                <div class="box-head">
                    <h2 id="m-h">{{ slotInfo.name }} menu</h2>
                    <span class="muted">{{ slotInfo.help }}</span>
                </div>
                <ul class="list">
                    <li v-for="(item, i) in items" :key="item.id" :class="[{ sel: item.id === selectedId, sub: item.depth === 1 }, dr.rowClass(i)]" data-drag-row @dragover="dr.overRow($event, i)" @drop.prevent="dr.drop">
                        <button class="pick" type="button" :aria-pressed="item.id === selectedId" @click="selectedId = item.id">
                            <b>{{ item.label || 'Untitled link' }}</b>
                            <span class="muted">{{ describe(item) }}</span>
                        </button>
                        <span class="tools">
                            <DragGrip @dragstart="dr.start($event, i)" @dragend="dr.end" />
                            <button v-if="slot === 'header' && i > 0" class="ib" type="button" :aria-label="item.depth ? `Move ${item.label} out of the dropdown` : `Put ${item.label} in a dropdown under the link above`" :title="item.depth ? 'Out of dropdown' : 'Into dropdown'" @click="item.depth = item.depth ? 0 : 1">
                                {{ item.depth ? '←' : '→' }}
                            </button>
                            <button class="ib" type="button" :aria-label="`Move ${item.label} up`" :disabled="i === 0" @click="move(i, -1)">↑</button>
                            <button class="ib" type="button" :aria-label="`Move ${item.label} down`" :disabled="i === items.length - 1" @click="move(i, 1)">↓</button>
                        </span>
                    </li>
                    <li v-if="!items.length" class="empty muted">No links yet.</li>
                </ul>
                <button class="btn btn-ghost add" type="button" @click="addLink">Add a link</button>
            </section>

            <section class="panel box" aria-labelledby="e-h">
                <template v-if="selected">
                    <h2 id="e-h">Edit link</h2>
                    <div class="field"><label for="ml">Text</label><input id="ml" v-model="selected.label" class="inp" type="text" maxlength="60"></div>
                    <div class="field">
                        <label for="mt">Goes to</label>
                        <select id="mt" v-model="target" class="inp">
                            <option v-for="p in pages" :key="p.id" :value="p.path">Page: {{ p.title }}</option>
                            <option value="__other">A web address, email or phone number</option>
                        </select>
                    </div>
                    <div v-if="target === '__other'" class="field">
                        <label for="mu">Address</label>
                        <input id="mu" v-model="selected.url" class="inp" type="text" placeholder="https://… or mailto:you@… or tel:…">
                    </div>
                    <label v-if="slot === 'header'" class="check"><input v-model="selected.button" type="checkbox">Show as a button</label>
                    <label class="check"><input v-model="selected.newTab" type="checkbox">Open in a new tab</label>
                    <button class="btn btn-danger" type="button" @click="remove(selected.id)">Remove link</button>
                </template>
                <template v-else>
                    <h2 id="e-h">Edit link</h2>
                    <p class="muted">Pick a link on the left to change it.</p>
                </template>

                <div class="mini" :style="themeVars">
                    <SiteHeader v-if="slot === 'header'" :name="site?.name ?? ''" :items="items" :theme="(site?.theme as SiteTheme)" :socials="(site?.socials as SiteSocials)" preview />
                    <SiteFooter v-else :name="site?.name ?? ''" :items="drafts.footer" :legal="drafts.legal" :theme="(site?.theme as SiteTheme)" :socials="(site?.socials as SiteSocials)" preview />
                </div>
                <span class="muted">Preview of your {{ slot === 'header' ? 'header' : 'footer' }}</span>
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
.note { background: #fdf3e2; border-radius: var(--radius); color: var(--warn-text); font-size: 15px; margin: 0; padding: 12px 14px; }

.seg { align-self: flex-start; background: var(--mist); border-radius: var(--radius-lg); display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; }
.seg button { background: transparent; border: 0; border-radius: var(--radius); color: var(--text-body); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 12px; }
.seg button.on { background: var(--white); box-shadow: 0 1px 2px rgb(46 52 69 / 15%); color: var(--quarry); }

.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
.box { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
.box-head { display: flex; flex-direction: column; gap: 2px; }

.list { display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 0; padding: 0; }
.list li { align-items: center; background: var(--white); border-radius: var(--radius); box-shadow: 0 0 0 1px var(--line); display: flex; gap: 8px; padding: 4px 6px 4px 4px; }
.list li.sub { margin-left: 32px; }
.list li.sel { box-shadow: 0 0 0 2px var(--quarry); }
.list li.empty { box-shadow: none; padding: 8px 0; }
.pick { background: none; border: 0; color: var(--quarry); cursor: pointer; display: flex; flex: 1; flex-direction: column; font-family: inherit; gap: 1px; padding: 8px; text-align: left; }
.pick b { font-size: 15px; font-weight: 600; }
.tools { align-items: center; display: flex; gap: 2px; }
.ib { align-items: center; background: transparent; border: 0; border-radius: var(--radius); color: var(--quarry); cursor: pointer; display: inline-flex; font-size: 15px; height: 34px; justify-content: center; width: 34px; }
.ib:hover:not(:disabled) { background: var(--mist); }
.ib:disabled { cursor: default; opacity: .3; }
.add { align-self: flex-start; }

.field label { font-size: 14px; font-weight: 600; }
.inp { font-size: 15px; height: 42px; }
.check { align-items: center; display: flex; font-size: 15px; gap: 10px; }
.check input { accent-color: var(--quarry); height: 18px; width: 18px; }
.btn-danger { align-self: flex-start; background: var(--white); box-shadow: inset 0 0 0 1.5px #e3b2ac; color: var(--danger); }
.btn-danger:hover { box-shadow: inset 0 0 0 1.5px var(--danger); color: var(--danger); }
.mini { border-radius: var(--radius); box-shadow: 0 0 0 1px var(--line); margin-top: 8px; overflow: hidden; pointer-events: none; zoom: .8; }

@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
