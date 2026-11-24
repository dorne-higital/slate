<script setup lang="ts">
useHead({ title: 'Reset your password · Slate' })
const email = ref('')
const busy = ref(false)
const sent = ref(false)
const error = ref('')
async function submit() {
    busy.value = true
    error.value = ''
    try {
        await $fetch('/api/auth/request-password-reset', { method: 'POST', body: { email: email.value, redirectTo: '/reset-password' } })
        sent.value = true
    } catch {
        error.value = 'Couldn’t send the email just now. Please try again in a minute.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>
        <div v-if="sent" class="panel card" role="status">
            <h1>Check your email</h1>
            <p class="big">If there’s a Slate account for {{ email }}, we’ve sent it a link to choose a new password. The link lasts an hour.</p>
            <p class="small"><NuxtLink to="/login">Back to log in</NuxtLink></p>
        </div>
        <form v-else class="panel card" @submit.prevent="submit">
            <h1>Reset your password</h1>
            <p class="big">Type the email you log in with and we’ll send you a link.</p>
            <p v-if="error" class="error-box" role="alert">{{ error }}</p>
            <div class="field"><label for="fp-email">Email</label><input id="fp-email" v-model="email" class="inp" type="email" autocomplete="email" required></div>
            <button class="btn btn-dark btn-lg" type="submit" :disabled="busy">{{ busy ? 'Sending…' : 'Send reset link' }}</button>
            <p class="small"><NuxtLink to="/login">Back to log in</NuxtLink></p>
        </form>
    </div>
</template>

<style scoped>
.wrap { align-items: center; display: flex; flex-direction: column; gap: 32px; min-height: 100vh; padding: 64px 16px; }
.home-link { text-decoration: none; }
.card { display: flex; flex-direction: column; gap: 18px; max-width: 440px; padding: 32px; width: 100%; }
h1 { font-size: 30px; font-weight: 900; letter-spacing: -.035em; margin: 0; }
.big { color: var(--text-body); font-size: 16px; line-height: 1.55; margin: 0; }
.small { font-size: 14px; margin: 0; }
</style>
