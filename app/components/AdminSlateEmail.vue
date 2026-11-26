<script setup lang="ts">
// Admin dashboard: is mail to hello@slatecms.co.uk reaching Dan? One button sets it up. The inbox itself is never shown.
interface Status { ready: boolean, receiving: boolean, forwarding: boolean, confirmed: boolean }
const { data, refresh } = useAsyncData('admin-slate-email', () => $fetch<Status>('/api/admin/slate-email'), { server: false, lazy: true })
const busy = ref(false)
const error = ref('')
async function setUp() {
    busy.value = true
    error.value = ''
    try {
        data.value = await $fetch<Status>('/api/admin/slate-email', { method: 'POST' })
    } catch (err) {
        error.value = (err as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Couldn’t set it up. Try again in a minute.'
    } finally {
        busy.value = false
    }
}
const state = computed(() => {
    const s = data.value
    if (!s) return null
    if (s.forwarding && s.confirmed && s.receiving) return { ok: true, text: 'Everything sent to @slatecms.co.uk, including hello@, reaches your private inbox.' }
    if (s.forwarding && !s.confirmed) return { ok: false, text: 'Almost there: Cloudflare has emailed your private inbox. Press the link in that email, then check again.' }
    if (!s.ready) return { ok: false, text: 'Mail to hello@slatecms.co.uk bounces. The private inbox setting (NUXT_SLATE_MAIL_TO) isn’t on the live site yet.' }
    return { ok: false, text: 'Mail to hello@slatecms.co.uk bounces at the moment.', action: true }
})
</script>

<template>
    <section v-if="state" class="panel mail" :class="{ ok: state.ok }">
        <div>
            <h2>hello@slatecms.co.uk</h2>
            <p>{{ state.text }}</p>
            <p v-if="error" class="error-box">{{ error }}</p>
        </div>
        <button v-if="state.action" class="btn btn-dark btn-sm" type="button" :disabled="busy" @click="setUp">{{ busy ? 'Setting up…' : 'Send it to my inbox' }}</button>
        <button v-else-if="!state.ok" class="btn btn-ghost btn-sm" type="button" @click="() => refresh()">Check again</button>
    </section>
</template>

<style scoped>
.mail { align-items: center; border-left: 4px solid var(--danger); display: flex; flex-wrap: wrap; gap: 12px 20px; justify-content: space-between; }
.mail.ok { border-left-color: #2e8b4a; }
.mail h2 { font-size: 15px; margin: 0 0 2px; }
.mail p { margin: 0; }
</style>
