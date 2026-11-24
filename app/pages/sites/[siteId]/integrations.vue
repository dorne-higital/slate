<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me } = useMe()

const { data: site } = await useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
useHead({ title: 'Integrations · Slate' })

const canEdit = computed(() => ROLE_RANK[me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer'] >= ROLE_RANK.admin)
const values = ref<SiteIntegrations>({ ...(site.value?.integrations as SiteIntegrations) })
const open = ref<keyof SiteIntegrations | null>(null)
const draft = ref('')
const error = ref('')
const busy = ref(false)

const groups = computed(() => {
    const names = [...new Set([...INTEGRATIONS.map(i => i.group), ...COMING_SOON.map(c => c.group)])]
    return names.map(g => ({ name: g, live: INTEGRATIONS.filter(i => i.group === g), soon: COMING_SOON.filter(c => c.group === g) }))
})

function edit(key: keyof SiteIntegrations) {
    open.value = open.value === key ? null : key
    draft.value = values.value[key] ?? ''
    error.value = ''
}

async function save(key: keyof SiteIntegrations, value: string) {
    busy.value = true
    error.value = ''
    try {
        values.value = await $fetch<SiteIntegrations>(`/api/sites/${siteId}/integrations`, { method: 'PUT', body: { key, value } })
        open.value = null
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save. Please try again.'
    } finally {
        busy.value = false
    }
}

const logo = (name: string) => name[0]
</script>

<template>
    <div class="page">
        <div class="head"><h1>Integrations</h1></div>
        <p class="lead">Connect the tools you already use. Paste the ID from your own account, and disconnect at any time.</p>

        <section v-for="g in groups" :key="g.name" class="group" :aria-labelledby="`g-${g.name}`">
            <h2 :id="`g-${g.name}`">{{ g.name }}</h2>
            <div class="grid">
                <div v-for="i in g.live" :key="i.key" class="panel card" :class="{ open: open === i.key }">
                    <div class="card-top">
                        <span class="logo" aria-hidden="true">{{ logo(i.name) }}</span>
                        <span class="card-text"><b>{{ i.name }}</b><span class="muted">{{ i.desc }}</span></span>
                        <span v-if="values[i.key]" class="pill"><i />Connected</span>
                        <button v-if="canEdit" class="btn btn-sm" :class="values[i.key] ? 'btn-ghost' : 'btn-dark'" type="button" :aria-expanded="open === i.key" @click="edit(i.key)">{{ values[i.key] ? 'Settings' : 'Connect' }}</button>
                    </div>
                    <form v-if="open === i.key" class="card-form" @submit.prevent="save(i.key, draft)">
                        <div class="field">
                            <label :for="`in-${i.key}`">{{ i.label }}</label>
                            <input :id="`in-${i.key}`" v-model="draft" class="inp" type="text" :placeholder="i.placeholder" autocomplete="off" spellcheck="false">
                            <span class="help">{{ i.help }}</span>
                            <span v-if="i.needsConsent" class="help">Visitors are asked for cookie consent before this runs, as UK law requires.</span>
                        </div>
                        <p v-if="error" class="err" role="alert">{{ error }}</p>
                        <div class="row">
                            <button class="btn btn-dark btn-sm" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save' }}</button>
                            <button v-if="values[i.key]" class="btn btn-plain btn-sm danger" type="button" :disabled="busy" @click="save(i.key, '')">Disconnect</button>
                            <button class="btn btn-plain btn-sm" type="button" @click="open = null">Cancel</button>
                        </div>
                    </form>
                    <p v-else-if="values[i.key]" class="muted current">{{ values[i.key] }}</p>
                </div>
                <div v-for="c in g.soon" :key="c.name" class="panel card soon">
                    <div class="card-top">
                        <span class="logo" aria-hidden="true">{{ logo(c.name) }}</span>
                        <span class="card-text"><b>{{ c.name }}</b><span class="muted">{{ c.desc }}</span></span>
                        <span class="tag">Coming soon</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="group" aria-labelledby="g-spam">
            <h2 id="g-spam">Spam protection</h2>
            <div class="grid">
                <div class="panel card">
                    <div class="card-top">
                        <span class="logo" aria-hidden="true">✓</span>
                        <span class="card-text"><b>Built in</b><span class="muted">Every form blocks bots and limits repeat sending. Nothing to set up.</span></span>
                        <span class="pill"><i />On</span>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: -8px 0 0; max-width: 46em; }
.group { display: flex; flex-direction: column; gap: 12px; }
h2 { color: var(--text-muted); font-size: 14px; font-weight: 700; margin: 0; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); }
.card { display: flex; flex-direction: column; gap: 14px; padding: 16px 18px; }
.card.open { box-shadow: 0 0 0 2px var(--quarry); }
.card-top { align-items: center; display: flex; gap: 14px; }
.logo { align-items: center; background: var(--mist); border-radius: var(--radius-lg); color: var(--quarry); display: flex; flex: none; font-size: 18px; font-weight: 800; height: 42px; justify-content: center; width: 42px; }
.card-text { display: flex; flex: 1; flex-direction: column; gap: 2px; min-width: 0; }
.card-text b { font-size: 16px; }
.pill { align-items: center; color: var(--ok-text); display: inline-flex; font-size: 13px; font-weight: 600; gap: 7px; white-space: nowrap; }
.pill i { background: var(--ok); border-radius: 50%; display: block; height: 8px; width: 8px; }
.tag { background: var(--mist); border-radius: 999px; color: var(--text-muted); font-size: 12px; font-weight: 700; padding: 3px 9px; white-space: nowrap; }
.soon { opacity: .75; }
.card-form { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 12px; padding-top: 14px; }
.field label { font-size: 14px; }
.inp { font-family: ui-monospace, monospace; font-size: 15px; height: 42px; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.danger { color: var(--danger); }
.current { font-family: ui-monospace, monospace; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 420px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
