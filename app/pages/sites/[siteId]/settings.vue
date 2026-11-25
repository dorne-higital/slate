<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me, refresh: refreshMe } = useMe()

const myRole = computed<SiteRole>(() => me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer')
const isAdmin = computed(() => ROLE_RANK[myRole.value] >= ROLE_RANK.admin)
const isOwner = computed(() => myRole.value === 'owner')

const { data: site, refresh: refreshSite } = await useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
useHead({ title: 'Settings · Slate' })

// ── General ──
const general = reactive({ name: site.value?.name ?? '', replyEmail: site.value?.replyEmail ?? '' })
const generalState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const generalError = ref('')
async function saveGeneral() {
    generalState.value = 'saving'
    try {
        await $fetch(`/api/sites/${siteId}`, { method: 'PATCH', body: general })
        await Promise.all([refreshSite(), refreshMe()])
        generalState.value = 'saved'
    } catch (err) {
        generalError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t save. Please try again.'
        generalState.value = 'error'
    }
}

// ── Social links ──
const SOCIAL_LABELS: Record<SocialNetwork, { name: string, placeholder: string }> = {
    facebook: { name: 'Facebook', placeholder: 'facebook.com/yourpage' },
    instagram: { name: 'Instagram', placeholder: 'instagram.com/yourname' },
    x: { name: 'X (Twitter)', placeholder: 'x.com/yourname' },
    linkedin: { name: 'LinkedIn', placeholder: 'linkedin.com/company/yourbusiness' },
    tiktok: { name: 'TikTok', placeholder: 'tiktok.com/@yourname' },
    youtube: { name: 'YouTube', placeholder: 'youtube.com/@yourchannel' },
    pinterest: { name: 'Pinterest', placeholder: 'pinterest.com/yourname' },
    threads: { name: 'Threads', placeholder: 'threads.net/@yourname' }
}
const socials = reactive<Record<string, string>>({ ...((site.value?.socials as SiteSocials) ?? {}) })
const socialState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
async function saveSocials() {
    socialState.value = 'saving'
    try {
        const res = await $fetch<{ socials: SiteSocials }>(`/api/sites/${siteId}`, { method: 'PATCH', body: { socials } })
        for (const k of [...SOCIAL_NETWORKS, ...APP_STORES]) socials[k] = res.socials[k] ?? ''
        await refreshSite()
        socialState.value = 'saved'
    } catch {
        socialState.value = 'error'
    }
}

// ── Offline / delete ──
const offlineBusy = ref(false)
async function toggleOffline() {
    offlineBusy.value = true
    await $fetch(`/api/sites/${siteId}`, { method: 'PATCH', body: { offline: !site.value?.offline } })
    await refreshSite()
    offlineBusy.value = false
}
const deleting = ref(false)
const deleteConfirm = ref('')
const deleteError = ref('')
async function deleteSite() {
    deleteError.value = ''
    try {
        await $fetch(`/api/sites/${siteId}`, { method: 'DELETE', body: { confirm: deleteConfirm.value } })
        await refreshMe()
        await navigateTo(me.value?.isPlatformAdmin ? '/admin' : me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/')
    } catch (err) {
        deleteError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t delete the site.'
    }
}
</script>

<template>
    <div class="page">
        <div class="head">
            <h1>Settings</h1>
            <p class="lead">Your site’s name and contact details, links to your social media and apps, and the bigger switches.</p>
        </div>

        <section class="set" aria-labelledby="g-h">
            <div class="set-info">
                <h2 id="g-h">General</h2>
                <p>The name visitors see, and where new form replies are emailed.</p>
            </div>
            <div class="panel set-body">
                <p v-if="generalState === 'error'" class="error-box" role="alert">{{ generalError }}</p>
                <div class="pair">
                    <div class="field"><label for="sn">Site name</label><input id="sn" v-model="general.name" class="inp" type="text" maxlength="80" :disabled="!isAdmin"></div>
                    <div class="field">
                        <label for="se">Email for form replies</label>
                        <input id="se" v-model="general.replyEmail" class="inp" type="email" placeholder="hello@yourbusiness.co.uk" :disabled="!isAdmin">
                        <span class="help">Leave empty to use the site owner’s email.</span>
                    </div>
                </div>
                <div class="field">
                    <span class="lbl">Free address</span>
                    <span class="mono">{{ site?.freeAddress }}</span>
                </div>
                <div v-if="isAdmin" class="row foot">
                    <button class="btn btn-dark" type="button" :disabled="generalState === 'saving'" @click="saveGeneral">{{ generalState === 'saving' ? 'Saving…' : 'Save' }}</button>
                    <span v-if="generalState === 'saved'" class="muted" role="status">Saved.</span>
                </div>
            </div>
        </section>

        <section class="set" aria-labelledby="so-h">
            <div class="set-info">
                <h2 id="so-h">Social media</h2>
                <p>Shown as icons in your footer, and in your header if you turn that on in <NuxtLink :to="`/sites/${siteId}/layout`">Layout</NuxtLink>. Leave any you don’t use empty.</p>
            </div>
            <div class="panel set-body">
                <div class="soc-grid">
                    <div v-for="n in SOCIAL_NETWORKS" :key="n" class="field">
                        <label :for="`so-${n}`">{{ SOCIAL_LABELS[n].name }}</label>
                        <input :id="`so-${n}`" v-model="socials[n]" class="inp" type="url" inputmode="url" :placeholder="SOCIAL_LABELS[n].placeholder" :disabled="!isAdmin" autocomplete="off">
                    </div>
                </div>
                <div v-if="isAdmin" class="row foot">
                    <button class="btn btn-dark" type="button" :disabled="socialState === 'saving'" @click="saveSocials">{{ socialState === 'saving' ? 'Saving…' : 'Save' }}</button>
                    <span v-if="socialState === 'saved'" class="muted" role="status">Saved.</span>
                    <span v-if="socialState === 'error'" class="err" role="alert">Couldn’t save. Check the addresses and try again.</span>
                </div>
            </div>
        </section>

        <section class="set" aria-labelledby="as-h">
            <div class="set-info">
                <h2 id="as-h">App store links</h2>
                <p>Got an app? Showcase blocks can then show App Store and Google Play buttons, plus a QR code that sends each phone to the right store.</p>
            </div>
            <div class="panel set-body">
                <div class="pair">
                    <div class="field">
                        <label for="as-ios">App Store (iPhone)</label>
                        <input id="as-ios" v-model="socials.appStore" class="inp" type="url" inputmode="url" placeholder="apps.apple.com/gb/app/…" :disabled="!isAdmin" autocomplete="off">
                    </div>
                    <div class="field">
                        <label for="as-play">Google Play (Android)</label>
                        <input id="as-play" v-model="socials.googlePlay" class="inp" type="url" inputmode="url" placeholder="play.google.com/store/apps/details?id=…" :disabled="!isAdmin" autocomplete="off">
                    </div>
                </div>
                <div v-if="isAdmin" class="row foot">
                    <button class="btn btn-dark" type="button" :disabled="socialState === 'saving'" @click="saveSocials">{{ socialState === 'saving' ? 'Saving…' : 'Save' }}</button>
                    <span v-if="socialState === 'saved'" class="muted" role="status">Saved. Links that aren’t App Store or Google Play pages are left out.</span>
                </div>
            </div>
        </section>

        <section class="set" aria-labelledby="pd-h">
            <div class="set-info">
                <h2 id="pd-h">People and your data</h2>
                <p>Who can work on this site, and a copy of everything in it.</p>
            </div>
            <div class="panel set-body list">
                <div class="line">
                    <span class="line-text"><b>People</b><span class="muted">Invite people, change what they can do, or leave this site.</span></span>
                    <NuxtLink class="btn btn-ghost btn-sm" :to="`/sites/${siteId}/people`">Go to People</NuxtLink>
                </div>
                <div v-if="isAdmin" class="line">
                    <span class="line-text"><b>Download everything</b><span class="muted">A zip of your pages, posts, menus, form replies (as spreadsheets) and images.</span></span>
                    <a class="btn btn-ghost btn-sm" :href="`/api/sites/${siteId}/export`" download>Download a copy</a>
                </div>
            </div>
        </section>

        <section v-if="isAdmin" class="set" aria-labelledby="x-h">
            <div class="set-info">
                <h2 id="x-h">Offline or delete</h2>
                <p>Pause the site while you work on it, or remove it for good.</p>
            </div>
            <div class="panel set-body list danger-zone">
                <div class="line">
                    <span class="line-text"><b>{{ site?.offline ? 'Your site is offline' : 'Take the site offline' }}</b><span class="muted">{{ site?.offline ? 'Visitors see your Offline page.' : 'Visitors see your Offline page (edit it in Pages › System pages). Everything stays saved and you can turn it back on.' }}</span></span>
                    <button class="btn btn-sm" :class="site?.offline ? 'btn-dark' : 'btn-danger'" type="button" :disabled="offlineBusy" @click="toggleOffline">{{ site?.offline ? 'Put back online' : 'Take offline' }}</button>
                </div>
                <div v-if="isOwner" class="line">
                    <span class="line-text"><b>Delete this site</b><span class="muted">Gone straight away for everyone. We keep a copy for 30 days in case you change your mind.</span></span>
                    <button v-if="!deleting" class="btn btn-danger btn-sm" type="button" @click="deleting = true">Delete site</button>
                </div>
                <form v-if="deleting" class="confirm" @submit.prevent="deleteSite">
                    <label for="del-confirm">Type <b>{{ site?.name }}</b> to confirm</label>
                    <input id="del-confirm" v-model="deleteConfirm" class="inp" type="text" autocomplete="off">
                    <p v-if="deleteError" class="err" role="alert">{{ deleteError }}</p>
                    <div class="row">
                        <button class="btn btn-sm del" type="submit">Delete this site</button>
                        <button class="btn btn-plain btn-sm" type="button" @click="deleting = false">Keep it</button>
                    </div>
                </form>
            </div>
        </section>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 0; max-width: 1080px; }
.head { padding-bottom: 28px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
.lead { color: var(--text-body); font-size: 15px; line-height: 1.6; margin: 6px 0 0; }
h2 { font-size: 17px; margin: 0; }
/* One row per section: what it is on the left, the settings on the right */
.set { border-top: 1px solid var(--line); display: grid; gap: 16px 40px; grid-template-columns: minmax(0, 280px) minmax(0, 1fr); padding: 28px 0; }
.set-info { display: flex; flex-direction: column; gap: 6px; }
.set-info p { color: var(--text-muted); font-size: 14px; line-height: 1.55; margin: 0; }
.set-body { display: flex; flex-direction: column; gap: 18px; padding: 22px; }
.set-body.list { gap: 0; padding: 0; }
.line { align-items: center; display: flex; flex-wrap: wrap; gap: 12px 20px; justify-content: space-between; padding: 18px 22px; }
.line + .line { border-top: 1px solid var(--line-soft); }
.line-text { display: flex; flex: 1 1 260px; flex-direction: column; gap: 3px; }
.line-text b { font-size: 15px; }
.line-text .muted { font-size: 14px; line-height: 1.5; }
.pair { display: grid; gap: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.foot { border-top: 1px solid var(--line-soft); margin: 0 -22px -22px; padding: 14px 22px; }
.help { color: var(--text-muted); font-size: 13px; }
.field label, .lbl { font-size: 14px; font-weight: 600; }
.inp { font-size: 15px; height: 42px; }
.mono { font-family: ui-monospace, monospace; font-size: 14px; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 10px; }
.self-start { align-self: flex-start; }
.ph { align-items: center; display: flex; justify-content: space-between; padding: 16px 20px; }
.inset { margin: 0 20px 12px; }
.scroll { overflow-x: auto; }
.tbl { min-width: 560px; }
.person { align-items: center; display: flex; gap: 12px; }
.avatar { align-items: center; background: var(--heather); border-radius: 50%; color: var(--white); display: flex; flex: none; font-size: 13px; font-weight: 700; height: 34px; justify-content: center; width: 34px; }
.avatar.dashed { background: transparent; border: 2px dashed var(--input-border); color: var(--text-muted); }
.person-text { display: flex; flex-direction: column; }
.person-text b { font-size: 15px; }
.role { font-weight: 600; }
.role-select { background: var(--white); border: 1.5px solid var(--line); border-radius: var(--radius); font: inherit; font-size: 14px; font-weight: 600; height: 34px; padding: 0 8px; }
.small { font-size: 14px; }
.end { text-align: right; }
.danger { color: var(--danger); }
.pending td { background: #fafbfc; }
.invite { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 12px; padding: 16px 20px 20px; }
.invite-row { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 12px; }
.grow { flex: 1 1 200px; }
.link-box { background: var(--paper); border-radius: var(--radius); display: flex; flex-direction: column; gap: 8px; padding: 12px; }
.link-row { display: flex; gap: 8px; }
.link-row .inp { flex: 1; }
.danger-zone { box-shadow: 0 0 0 1px #e3b2ac; }
.dz-row { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; }
.dz-row.top { border-top: 1px solid var(--line-soft); padding-top: 14px; }
.dz-text { color: var(--text-body); flex: 1; font-size: 14px; line-height: 1.5; min-width: 220px; }
.btn-danger { background: var(--white); box-shadow: inset 0 0 0 1.5px #e3b2ac; color: var(--danger); }
.btn-danger:hover { box-shadow: inset 0 0 0 1.5px var(--danger); color: var(--danger); }
.confirm { background: #fbeceb; border-radius: var(--radius); display: flex; flex-direction: column; gap: 10px; margin: 0 22px 18px; padding: 14px; }
.confirm label { font-size: 14px; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.del { background: var(--danger); color: var(--white); }
.soc-grid { display: grid; gap: 14px 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (max-width: 900px) {
    .set { grid-template-columns: minmax(0, 1fr); padding: 22px 0; }
}
@media (max-width: 560px) {
    .pair, .soc-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
