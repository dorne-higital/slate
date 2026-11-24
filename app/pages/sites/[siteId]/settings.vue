<script setup lang="ts">
definePageMeta({ layout: 'cms', middleware: 'auth' })
const route = useRoute()
const siteId = String(route.params.siteId)
const fetcher = useRequestFetch()
const { me, refresh: refreshMe } = useMe()

interface People {
    yourRole: SiteRole
    canInvite: SiteRole[]
    members: { userId: string, name: string, email: string, role: SiteRole, canManage: boolean }[]
    invites: { id: string, role: SiteRole, label: string | null, expiresAt: string, canManage: boolean }[]
}

const myRole = computed<SiteRole>(() => me.value?.sites.find(s => s.id === siteId)?.role ?? 'viewer')
const isAdmin = computed(() => ROLE_RANK[myRole.value] >= ROLE_RANK.admin)
const isOwner = computed(() => myRole.value === 'owner')

const { data: site, refresh: refreshSite } = await useAsyncData(`site-${siteId}`, () => fetcher(`/api/sites/${siteId}`))
const { data: people } = await useAsyncData(`people-${siteId}`, () => isAdmin.value ? fetcher<People>(`/api/sites/${siteId}/people`) : Promise.resolve(null))
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

// ── People ──
const peopleError = ref('')
const inviteRole = ref<SiteRole>('editor')
const inviteLabel = ref('')
const inviteEmail = ref('')
const inviteEmailed = ref(false)
const inviteUrl = ref('')
const copied = ref(false)
async function peopleCall(fn: () => Promise<unknown>) {
    peopleError.value = ''
    try {
        const res = await fn() as People | { people: People, url: string }
        if ('people' in res) {
            people.value = res.people
            inviteUrl.value = res.url
        } else {
            people.value = res
        }
    } catch (err) {
        peopleError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t work. Please try again.'
    }
}
const invite = () => peopleCall(() => $fetch(`/api/sites/${siteId}/invites`, { method: 'POST', body: { role: inviteRole.value, label: inviteLabel.value, email: inviteEmail.value } }).then((r) => {
    inviteEmailed.value = !!(r as { emailed?: boolean }).emailed
    inviteEmail.value = ''
    return r
}))
const cancelInvite = (id: string) => peopleCall(() => $fetch(`/api/sites/${siteId}/invites/${id}`, { method: 'DELETE' }))
const changeRole = (userId: string, role: SiteRole) => peopleCall(() => $fetch(`/api/sites/${siteId}/people/${userId}`, { method: 'PATCH', body: { role } }))
const removePerson = (userId: string) => peopleCall(() => $fetch(`/api/sites/${siteId}/people/${userId}`, { method: 'DELETE' }))
async function copyInvite() {
    try {
        await navigator.clipboard.writeText(inviteUrl.value)
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
    } catch {
        // Clipboard blocked: the link is on screen to copy by hand
    }
}
const initials = (n: string) => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()

async function leave() {
    await $fetch(`/api/sites/${siteId}/people/${me.value!.id}`, { method: 'DELETE' })
    await refreshMe()
    await navigateTo(me.value?.sites[0] ? `/sites/${me.value.sites[0].id}` : '/')
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
        <div class="head"><h1>Settings</h1></div>

        <div class="two">
            <section class="panel box" aria-labelledby="g-h">
                <h2 id="g-h">General</h2>
                <p v-if="generalState === 'error'" class="error-box" role="alert">{{ generalError }}</p>
                <div class="field"><label for="sn">Site name</label><input id="sn" v-model="general.name" class="inp" type="text" maxlength="80" :disabled="!isAdmin"></div>
                <div class="field">
                    <label for="se">Email for form replies</label>
                    <input id="se" v-model="general.replyEmail" class="inp" type="email" placeholder="hello@yourbusiness.co.uk" :disabled="!isAdmin">
                    <span class="help">We’ll email new form replies here once email sending is switched on. Until then they’re in your Forms inbox.</span>
                </div>
                <div class="field">
                    <span class="lbl">Free address</span>
                    <span class="mono">{{ site?.freeAddress }}</span>
                </div>
                <div v-if="isAdmin" class="row">
                    <button class="btn btn-dark" type="button" :disabled="generalState === 'saving'" @click="saveGeneral">{{ generalState === 'saving' ? 'Saving…' : 'Save settings' }}</button>
                    <span v-if="generalState === 'saved'" class="muted" role="status">Saved.</span>
                </div>
            </section>

            <div class="col">
                <section v-if="people" class="panel" aria-labelledby="p-h">
                    <div class="ph"><h2 id="p-h">People</h2></div>
                    <p v-if="peopleError" class="error-box inset" role="alert">{{ peopleError }}</p>
                    <div class="scroll">
                        <table class="tbl">
                            <tbody>
                                <tr v-for="m in people.members" :key="m.userId">
                                    <td>
                                        <span class="person">
                                            <span class="avatar" aria-hidden="true">{{ initials(m.name) }}</span>
                                            <span class="person-text"><b>{{ m.name }}<template v-if="m.userId === me?.id"> (you)</template></b><span class="muted">{{ m.email }}</span></span>
                                        </span>
                                    </td>
                                    <td>
                                        <select v-if="m.canManage && m.userId !== me?.id" class="role-select" :value="m.role" :aria-label="`Role for ${m.name}`" @change="changeRole(m.userId, ($event.target as HTMLSelectElement).value as SiteRole)">
                                            <option v-for="r in people.canInvite" :key="r" :value="r">{{ ROLE_INFO[r].name }}</option>
                                        </select>
                                        <b v-else class="role">{{ ROLE_INFO[m.role].name }}</b>
                                    </td>
                                    <td class="muted small">{{ ROLE_INFO[m.role].can }}</td>
                                    <td class="end">
                                        <button v-if="m.canManage && m.userId !== me?.id" class="btn btn-plain btn-sm danger" type="button" @click="removePerson(m.userId)">Remove</button>
                                    </td>
                                </tr>
                                <tr v-for="i in people.invites" :key="i.id" class="pending">
                                    <td><span class="person"><span class="avatar dashed" aria-hidden="true">?</span><span class="person-text"><b>{{ i.label || 'Invitation link' }}</b><span class="muted">Not used yet. Expires {{ new Date(i.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) }}</span></span></span></td>
                                    <td><b class="role">{{ ROLE_INFO[i.role].name }}</b></td>
                                    <td class="muted small">{{ ROLE_INFO[i.role].can }}</td>
                                    <td class="end"><button v-if="i.canManage" class="btn btn-plain btn-sm danger" type="button" @click="cancelInvite(i.id)">Cancel</button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <form v-if="people.canInvite.length" class="invite" @submit.prevent="invite">
                        <b>Invite someone</b>
                        <div class="invite-row">
                            <div class="field grow"><label for="inv-email">Their email (optional)</label><input id="inv-email" v-model="inviteEmail" class="inp" type="email" placeholder="ellie@example.co.uk" autocomplete="off"></div>
                            <div class="field grow"><label for="inv-label">Name (optional)</label><input id="inv-label" v-model="inviteLabel" class="inp" type="text" placeholder="e.g. Ellie" maxlength="120"></div>
                            <div class="field"><label for="inv-role">Role</label>
                                <select id="inv-role" v-model="inviteRole" class="inp">
                                    <option v-for="r in people.canInvite" :key="r" :value="r">{{ ROLE_INFO[r].name }}</option>
                                </select>
                            </div>
                            <button class="btn btn-ghost" type="submit">{{ inviteEmail ? 'Send invite' : 'Make invite link' }}</button>
                        </div>
                        <div v-if="inviteUrl" class="link-box">
                            <span class="muted">{{ inviteEmailed ? 'We’ve emailed them this link. You can also send it yourself.' : 'Send this link to them.' }} It works once and lasts 14 days.</span>
                            <div class="link-row"><input class="inp mono" type="text" readonly :value="inviteUrl" aria-label="Invite link" @focus="($event.target as HTMLInputElement).select()"><button class="btn btn-dark btn-sm" type="button" @click="copyInvite">{{ copied ? 'Copied' : 'Copy' }}</button></div>
                        </div>
                    </form>
                </section>

                <section v-else class="panel box">
                    <h2>People</h2>
                    <p class="muted">You’re {{ ROLE_INFO[myRole].name === 'Admin' ? 'an' : 'a' }} {{ ROLE_INFO[myRole].name.toLowerCase() }} on this site: {{ ROLE_INFO[myRole].can.toLowerCase() }}. Ask an owner or admin to change who has access.</p>
                    <button class="btn btn-plain danger self-start" type="button" @click="leave">Leave this site</button>
                </section>

                <section v-if="isAdmin" class="panel box danger-zone" aria-labelledby="x-h">
                    <h2 id="x-h">Take the site offline or delete it</h2>
                    <div class="dz-row">
                        <span class="dz-text">{{ site?.offline ? 'Your site is offline. Visitors see a short holding page.' : 'Visitors see a short holding page. Everything stays saved and you can turn it back on.' }}</span>
                        <button class="btn btn-sm" :class="site?.offline ? 'btn-dark' : 'btn-danger'" type="button" :disabled="offlineBusy" @click="toggleOffline">{{ site?.offline ? 'Put back online' : 'Take offline' }}</button>
                    </div>
                    <div v-if="isOwner" class="dz-row top">
                        <span class="dz-text">Deletes the site straight away for everyone. We keep a copy for 30 days in case you change your mind, then it’s gone for good.</span>
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
                </section>
            </div>
        </div>
    </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: 24px; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.two { align-items: start; display: grid; gap: 24px; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); }
.col { display: flex; flex-direction: column; gap: 24px; }
.box { display: flex; flex-direction: column; gap: 16px; padding: 20px; }
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
.confirm { background: #fbeceb; border-radius: var(--radius); display: flex; flex-direction: column; gap: 10px; padding: 14px; }
.confirm label { font-size: 14px; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.del { background: var(--danger); color: var(--white); }
@media (max-width: 1100px) { .two { grid-template-columns: minmax(0, 1fr); } }
</style>
