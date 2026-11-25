<script setup lang="ts">
// Someone opened an invitation link. Signed in: join with one click. Not signed in: log in or make an account.
const route = useRoute()
const token = String(route.params.token)
const { me, ensure, refresh } = useMe()
await ensure()

const { data, error } = await useAsyncData(`invite-${token}`, () => useRequestFetch()<{ siteName: string, role: SiteRole }>(`/api/invites/${token}`))
useHead({ title: () => data.value ? `Join ${data.value.siteName} · Slate` : 'Invitation · Slate' })

const busy = ref(false)
const failed = ref('')
async function accept() {
    busy.value = true
    failed.value = ''
    try {
        const { siteId } = await $fetch<{ siteId: string }>(`/api/invites/${token}/accept`, { method: 'POST' })
        await refresh()
        await navigateTo(`/sites/${siteId}`)
    } catch (err) {
        failed.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'That didn’t work. Ask for a new link.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>
        <div class="panel card">
            <template v-if="error || !data">
                <h1>This link doesn’t work any more</h1>
                <p class="muted big">Invitation links work once and last 14 days. Ask the person who sent it for a new one.</p>
            </template>
            <template v-else>
                <h1>Join {{ data.siteName }}</h1>
                <p class="big">You’ve been invited as {{ data.role === 'admin' || data.role === 'owner' ? 'an' : 'a' }} <b>{{ ROLE_INFO[data.role].name.toLowerCase() }}</b>: {{ ROLE_INFO[data.role].can.toLowerCase() }}.</p>
                <p v-if="failed" class="error-box" role="alert">{{ failed }}</p>
                <template v-if="me">
                    <button class="btn btn-lichen btn-lg" type="button" :disabled="busy" @click="accept">{{ busy ? 'Joining…' : `Join as ${me.name}` }}</button>
                    <span class="muted">Not you? <button class="link" type="button" @click="useMe().signOut()">Log out</button></span>
                </template>
                <template v-else>
                    <NuxtLink class="btn btn-lichen btn-lg" :to="`/signup?invite=${token}`">Make an account and join</NuxtLink>
                    <span class="muted">Already have an account? <NuxtLink :to="`/login?next=/invite/${token}`">Log in</NuxtLink></span>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped>
.wrap { align-items: center; display: flex; flex-direction: column; gap: 32px; min-height: 100vh; padding: 64px 16px; }
.home-link { text-decoration: none; }
.card { display: flex; flex-direction: column; gap: 18px; max-width: 480px; padding: 32px; width: 100%; }
h1 { font-size: 30px; font-weight: 900; letter-spacing: -.035em; margin: 0; }
.big { color: var(--text-body); font-size: 16px; line-height: 1.55; margin: 0; }
.link { background: none; border: 0; color: inherit; cursor: pointer; font: inherit; padding: 0; text-decoration: underline; }
</style>
