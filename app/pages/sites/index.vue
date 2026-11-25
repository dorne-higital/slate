<script setup lang="ts">
// Your sites, and starting another one (Studio plan, or anyone with no site yet).
definePageMeta({ middleware: 'auth' })
const { me, refresh } = useMe()
useHead({ title: 'Your sites · Slate' })

const name = ref('')
const layout = ref('trade')
const busy = ref(false)
const error = ref('')
const adding = ref(false)
// Studio over its included sites: say what it costs before adding one
const extra = ref<{ price: string, per: string } | null>(null)

async function create(confirmExtra = false) {
    busy.value = true
    error.value = ''
    try {
        const { siteId } = await $fetch<{ siteId: string }>('/api/sites', { method: 'POST', body: { name: name.value, layout: layout.value, confirmExtra } })
        await refresh()
        await navigateTo(`/sites/${siteId}`)
    } catch (err) {
        const data = (err as { data?: { statusMessage?: string, data?: { extraSite?: boolean, price: string, per: string } } }).data
        if (data?.data?.extraSite) {
            extra.value = { price: data.data.price, per: data.data.per }
            return
        }
        error.value = data?.statusMessage ?? 'Couldn’t create the site. Please try again.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <header class="top">
            <NuxtLink to="/" aria-label="Slate home" class="home"><BrandMark /></NuxtLink>
            <span class="top-links">
                <NuxtLink v-if="me?.isPlatformAdmin" to="/admin" class="btn btn-ghost btn-sm">All sites (admin)</NuxtLink>
                <NuxtLink to="/account" class="btn btn-ghost btn-sm">Your account</NuxtLink>
            </span>
        </header>
        <p v-if="$route.query.verified" class="ok-note" role="status">Thanks, your email is confirmed.</p>
        <div class="head">
            <h1>Your sites</h1>
            <button v-if="!adding" class="btn btn-dark" type="button" @click="adding = true">New site</button>
        </div>

        <form v-if="adding" class="panel box" @submit.prevent="create()">
            <h2>Start a new site</h2>
            <p v-if="error" class="error-box" role="alert">{{ error }}</p>
            <div class="field"><label for="ns-name">What’s it called?</label><input id="ns-name" v-model="name" class="inp" type="text" maxlength="80" required></div>
            <div class="field">
                <label for="ns-layout">Starting layout</label>
                <select id="ns-layout" v-model="layout" class="inp">
                    <option v-for="l in STARTER_LAYOUTS" :key="l.id" :value="l.id">{{ l.name }}</option>
                </select>
            </div>
            <div v-if="extra" class="confirm" role="alert">
                <b>This is an extra site</b>
                <span>Your Studio plan includes 5 sites. This one adds {{ extra.price }} a {{ extra.per }} to your bill, charged from today for the rest of your billing period. Delete it any time to stop paying for it.</span>
                <div class="row">
                    <button class="btn btn-dark" type="button" :disabled="busy" @click="create(true)">{{ busy ? 'Creating…' : `Add it for ${extra.price}/${extra.per === 'year' ? 'yr' : 'mo'}` }}</button>
                    <button class="btn btn-plain" type="button" @click="extra = null">Cancel</button>
                </div>
            </div>
            <div v-else class="row">
                <button class="btn btn-dark" type="submit" :disabled="busy">{{ busy ? 'Creating…' : 'Create site' }}</button>
                <button class="btn btn-plain" type="button" @click="adding = false">Cancel</button>
            </div>
            <span class="muted small">Each site counts towards your plan. Starter and Business include one; Studio includes 5, then £6 a month each.</span>
        </form>

        <ul class="list">
            <li v-for="s in me?.sites" :key="s.id">
                <NuxtLink :to="`/sites/${s.id}`" class="panel site">
                    <span class="badge" aria-hidden="true">{{ s.name[0] }}</span>
                    <span class="txt"><b>{{ s.name }}</b><span class="muted">{{ s.customDomain ?? s.slug }}</span></span>
                    <span class="muted role">{{ ROLE_INFO[s.role].name }}</span>
                </NuxtLink>
            </li>
            <li v-if="!me?.sites.length" class="muted">You’re not on any sites yet. Press New site to start one.</li>
        </ul>
    </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 24px; margin: 0 auto; max-width: 760px; padding: 32px 16px 64px; }
.top { align-items: center; display: flex; justify-content: space-between; }
.home { text-decoration: none; }
.head { align-items: center; display: flex; justify-content: space-between; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.inp { font-size: 15px; height: 42px; }
.row { display: flex; gap: 8px; }
.small { font-size: 13px; }
.ok-note { background: #e8f3ec; border-radius: var(--radius); color: var(--ok-text); margin: 0; padding: 12px 14px; }
.confirm { background: #fff6e6; border-radius: var(--radius); display: flex; flex-direction: column; gap: 8px; font-size: 14px; line-height: 1.5; padding: 14px; }
.list { display: flex; flex-direction: column; gap: 10px; list-style: none; margin: 0; padding: 0; }
.site { align-items: center; color: inherit; display: flex; gap: 14px; padding: 14px 18px; text-decoration: none; }
.site:hover { box-shadow: 0 0 0 2px var(--quarry); }
.badge { align-items: center; background: var(--quarry); border-radius: var(--radius); color: var(--white); display: flex; flex: none; font-weight: 800; height: 38px; justify-content: center; width: 38px; }
.txt { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.role { font-size: 13px; }
.top-links { display: flex; gap: 8px; }
</style>
