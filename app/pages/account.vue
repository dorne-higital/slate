<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { me, refresh } = useMe()
useHead({ title: 'Your account · Slate' })

// ── Details ──
const name = ref(me.value?.name ?? '')
const nameState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
async function saveName() {
    nameState.value = 'saving'
    try {
        await $fetch('/api/me', { method: 'PATCH', body: { name: name.value } })
        await refresh()
        nameState.value = 'saved'
    } catch {
        nameState.value = 'error'
    }
}
const resent = ref(false)
async function resend() {
    await $fetch('/api/me/resend-verification', { method: 'POST' }).catch(() => {})
    resent.value = true
}

// ── Password ──
const current = ref('')
const next = ref('')
const pwState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const pwError = ref('')
async function changePassword() {
    pwError.value = ''
    if (next.value.length < 10) {
        pwError.value = 'Your new password needs at least 10 characters.'
        return
    }
    pwState.value = 'saving'
    try {
        await $fetch('/api/auth/change-password', { method: 'POST', body: { currentPassword: current.value, newPassword: next.value, revokeOtherSessions: true } })
        current.value = ''
        next.value = ''
        pwState.value = 'saved'
    } catch {
        pwError.value = 'Your current password isn’t right.'
        pwState.value = 'error'
    }
}

// ── Delete ──
interface DeletionPlan {
    delete: { id: string, name: string }[]
    handOver: { id: string, name: string, to: string }[]
    leave: { id: string, name: string }[]
    blockers: { id: string, name: string }[]
    isPlatformAdmin: boolean
}
const showDelete = ref(false)
const plan = ref<DeletionPlan | null>(null)
const delPassword = ref('')
const understood = ref(false)
const deleting = ref(false)
const delError = ref('')
async function startDelete() {
    showDelete.value = true
    plan.value = await $fetch<DeletionPlan>('/api/me/deletion')
}
async function confirmDelete() {
    deleting.value = true
    delError.value = ''
    try {
        await $fetch('/api/me', { method: 'DELETE', body: { password: delPassword.value } })
        me.value = null
        await navigateTo('/?account=deleted')
    } catch (err) {
        delError.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t delete your account. Please try again.'
    } finally {
        deleting.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <header class="top">
            <NuxtLink to="/" aria-label="Slate home" class="home"><BrandMark /></NuxtLink>
            <NuxtLink to="/sites" class="btn btn-ghost btn-sm">Your sites</NuxtLink>
        </header>
        <h1>Your account</h1>

        <section class="panel box" aria-labelledby="d-h">
            <h2 id="d-h">Your details</h2>
            <form class="field" @submit.prevent="saveName">
                <label for="ac-name">Name</label>
                <div class="row">
                    <input id="ac-name" v-model="name" class="inp" type="text" maxlength="80" required autocomplete="name">
                    <button class="btn btn-ghost" type="submit" :disabled="nameState === 'saving'">Save</button>
                </div>
                <span v-if="nameState === 'saved'" class="muted small" role="status">Saved.</span>
            </form>
            <div class="field">
                <span class="lb">Email</span>
                <span>{{ me?.email }}
                    <span v-if="me?.emailVerified" class="tag ok">Confirmed</span>
                    <span v-else class="tag">Not confirmed</span>
                </span>
                <span v-if="!me?.emailVerified" class="small">
                    <button v-if="!resent" class="link" type="button" @click="resend">Send the confirmation link again</button>
                    <span v-else class="muted">Sent. Check your inbox and spam folder.</span>
                </span>
                <span class="help">To change your email address, ask us through Support on any of your sites.</span>
            </div>
        </section>

        <form class="panel box" aria-labelledby="p-h" @submit.prevent="changePassword">
            <h2 id="p-h">Password</h2>
            <p v-if="pwError" class="error-box" role="alert">{{ pwError }}</p>
            <div class="field"><label for="pw-cur">Current password</label><input id="pw-cur" v-model="current" class="inp" type="password" autocomplete="current-password" required></div>
            <div class="field"><label for="pw-new">New password</label><input id="pw-new" v-model="next" class="inp" type="password" autocomplete="new-password" minlength="10" required><span class="help">At least 10 characters. You’ll stay logged in here and be logged out everywhere else.</span></div>
            <div class="row">
                <button class="btn btn-dark" type="submit" :disabled="pwState === 'saving'">{{ pwState === 'saving' ? 'Saving…' : 'Change password' }}</button>
                <span v-if="pwState === 'saved'" class="muted small" role="status">Password changed.</span>
            </div>
        </form>

        <section class="panel box danger-zone" aria-labelledby="x-h">
            <h2 id="x-h">Delete your account</h2>
            <p class="muted">This removes your login and everything only you use. It can’t be undone.</p>
            <button v-if="!showDelete" class="btn btn-danger self-start" type="button" @click="startDelete">Delete my account…</button>

            <template v-if="showDelete && plan">
                <p v-if="plan.isPlatformAdmin" class="error-box">Platform admin accounts can’t be deleted here. Ask another admin to remove your admin access first.</p>
                <template v-else>
                    <div v-if="plan.blockers.length" class="error-box">
                        <b>First, make someone else an owner of:</b>
                        <ul><li v-for="s in plan.blockers" :key="s.id"><NuxtLink :to="`/sites/${s.id}/people`">{{ s.name }}</NuxtLink></li></ul>
                        Other people work on these sites, so they need an owner after you go.
                    </div>
                    <div class="what">
                        <b>What happens</b>
                        <ul>
                            <li>Any plan or domain you pay for is cancelled now, with no further charges. Your past invoices are kept for accounting.</li>
                            <li v-if="plan.delete.length">These sites are deleted (we keep a copy for 30 days, then they’re gone): <b>{{ plan.delete.map(s => s.name).join(', ') }}</b></li>
                            <li v-if="plan.handOver.length">These sites pass to their other owner, who gets a fresh free trial: <b>{{ plan.handOver.map(s => s.name).join(', ') }}</b></li>
                            <li v-if="plan.leave.length">You’ll be removed from: <b>{{ plan.leave.map(s => s.name).join(', ') }}</b></li>
                            <li>Pages and posts you wrote on shared sites stay, without your name.</li>
                        </ul>
                    </div>
                    <form v-if="!plan.blockers.length" class="confirm" @submit.prevent="confirmDelete">
                        <label class="check"><input v-model="understood" type="checkbox"> I understand this can’t be undone</label>
                        <div class="field"><label for="del-pw">Your password</label><input id="del-pw" v-model="delPassword" class="inp" type="password" autocomplete="current-password" required></div>
                        <p v-if="delError" class="err" role="alert">{{ delError }}</p>
                        <div class="row">
                            <button class="btn del" type="submit" :disabled="!understood || !delPassword || deleting">{{ deleting ? 'Deleting…' : 'Delete my account' }}</button>
                            <button class="btn btn-plain" type="button" @click="showDelete = false">Keep my account</button>
                        </div>
                    </form>
                </template>
            </template>
        </section>
    </div>
</template>

<style scoped>
.wrap { display: flex; flex-direction: column; gap: 20px; margin: 0 auto; max-width: 680px; padding: 32px 16px 64px; }
.top { align-items: center; display: flex; justify-content: space-between; }
.home { text-decoration: none; }
h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin: 0; }
h2 { font-size: 18px; margin: 0; }
.box { display: flex; flex-direction: column; gap: 14px; padding: 20px; }
.lb { font-size: 14px; font-weight: 600; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 8px; }
.row .inp { flex: 1 1 220px; }
.inp { font-size: 15px; height: 42px; }
.small { font-size: 13px; }
.tag { background: var(--mist); border-radius: 999px; font-size: 12px; font-weight: 700; margin-left: 8px; padding: 2px 8px; }
.tag.ok { background: #e8f3ec; color: var(--ok-text); }
.link { background: none; border: 0; color: inherit; cursor: pointer; font: inherit; padding: 0; text-decoration: underline; }
.danger-zone { box-shadow: 0 0 0 1px #e3b2ac; }
.btn-danger { background: var(--white); box-shadow: inset 0 0 0 1.5px #e3b2ac; color: var(--danger); }
.self-start { align-self: flex-start; }
.what { background: var(--paper); border-radius: var(--radius); font-size: 14px; line-height: 1.55; padding: 14px; }
.what ul, .error-box ul { margin: 6px 0 0; padding-left: 20px; }
.confirm { background: #fbeceb; border-radius: var(--radius); display: flex; flex-direction: column; gap: 12px; padding: 14px; }
.check { align-items: center; display: flex; font-size: 14px; gap: 8px; }
.err { color: var(--danger); font-size: 14px; margin: 0; }
.del { background: var(--danger); color: var(--white); }
</style>
