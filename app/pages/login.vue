<script setup lang="ts">
useHead({ title: 'Log in · Slate' })
const route = useRoute()
const { comingSoon } = useRuntimeConfig().public
const { refresh } = useMe()

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

const turnstileToken = ref('')
const turnstile = ref<{ reset: () => void, token: () => Promise<string> } | null>(null)

async function submit() {
    busy.value = true
    error.value = ''
    try {
        await $fetch('/api/auth/sign-in/email', { method: 'POST', body: { email: email.value, password: password.value }, headers: { 'x-turnstile-token': await turnstile.value?.token() ?? turnstileToken.value } })
        const me = await refresh()
        const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : null
        const home = me?.isPlatformAdmin ? '/admin' : me?.sites[0] ? `/sites/${me.sites[0].id}` : '/'
        await navigateTo(next ?? home)
    } catch (err) {
        const message = (err as { data?: { message?: string } }).data?.message
        error.value = message?.includes('robot') ? message : 'That email and password don’t match an account. Check them and try again.'
        turnstile.value?.reset()
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>
        <form class="panel card" @submit.prevent="submit">
            <h1>Log in</h1>
            <p v-if="error" class="error-box" role="alert">{{ error }}</p>
            <div class="field"><label for="li-email">Email</label><input id="li-email" v-model="email" class="inp" type="email" autocomplete="email" required></div>
            <div class="field"><label for="li-pass">Password</label><input id="li-pass" v-model="password" class="inp" type="password" autocomplete="current-password" required></div>
            <TurnstileWidget ref="turnstile" @token="turnstileToken = $event" />
            <button class="btn btn-dark btn-lg" type="submit" :disabled="busy">{{ busy ? 'Logging in…' : 'Log in' }}</button>
            <p class="small"><NuxtLink to="/forgot-password">Forgot your password?</NuxtLink></p>
            <p v-if="comingSoon" class="small">New to Slate? We’re not open yet. <NuxtLink to="/">Register your interest</NuxtLink></p>
            <p v-else class="small">New to Slate? <NuxtLink to="/signup">Start your site</NuxtLink></p>
        </form>
    </div>
</template>

<style scoped>
.wrap { align-items: center; display: flex; flex-direction: column; gap: 32px; min-height: 100vh; padding: 64px 16px; }
.home-link { text-decoration: none; }
.card { display: flex; flex-direction: column; gap: 20px; max-width: 420px; padding: 32px; width: 100%; }
h1 { font-size: 32px; font-weight: 900; letter-spacing: -.035em; margin: 0; }
.small { color: var(--text-muted); font-size: 14px; margin: 0; }
</style>
