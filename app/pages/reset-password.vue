<script setup lang="ts">
useHead({ title: 'Choose a new password · Slate' })
const route = useRoute()
const token = typeof route.query.token === 'string' ? route.query.token : ''
const badLink = !token || route.query.error === 'INVALID_TOKEN'
const password = ref('')
const busy = ref(false)
const done = ref(false)
const error = ref('')
async function submit() {
    error.value = ''
    if (password.value.length < 10) {
        error.value = 'Your password needs at least 10 characters.'
        return
    }
    busy.value = true
    try {
        await $fetch('/api/auth/reset-password', { method: 'POST', body: { token, newPassword: password.value } })
        done.value = true
    } catch {
        error.value = 'This link has expired or has already been used. Ask for a new one.'
    } finally {
        busy.value = false
    }
}
</script>

<template>
    <div class="wrap">
        <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark /></NuxtLink>
        <div v-if="badLink" class="panel card">
            <h1>This link doesn’t work any more</h1>
            <p class="big">Reset links last an hour and work once.</p>
            <NuxtLink class="btn btn-dark btn-lg" to="/forgot-password">Send a new link</NuxtLink>
        </div>
        <div v-else-if="done" class="panel card" role="status">
            <h1>Password changed</h1>
            <p class="big">You’ve been logged out everywhere else. Log in with your new password.</p>
            <NuxtLink class="btn btn-dark btn-lg" to="/login">Log in</NuxtLink>
        </div>
        <form v-else class="panel card" @submit.prevent="submit">
            <h1>Choose a new password</h1>
            <p v-if="error" class="error-box" role="alert">{{ error }} <NuxtLink v-if="error.includes('expired')" to="/forgot-password">Send a new link</NuxtLink></p>
            <div class="field">
                <label for="rp-pass">New password</label>
                <input id="rp-pass" v-model="password" class="inp" type="password" autocomplete="new-password" minlength="10" required>
                <span class="help">At least 10 characters.</span>
            </div>
            <button class="btn btn-dark btn-lg" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Save new password' }}</button>
        </form>
    </div>
</template>

<style scoped>
.wrap { align-items: center; display: flex; flex-direction: column; gap: 32px; min-height: 100vh; padding: 64px 16px; }
.home-link { text-decoration: none; }
.card { display: flex; flex-direction: column; gap: 18px; max-width: 440px; padding: 32px; width: 100%; }
h1 { font-size: 30px; font-weight: 900; letter-spacing: -.035em; margin: 0; }
.big { color: var(--text-body); font-size: 16px; line-height: 1.55; margin: 0; }
</style>
