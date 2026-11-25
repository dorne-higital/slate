<script setup lang="ts">
// "Please confirm your email" with a resend button. Shown in the CMS and wherever a confirmed email is needed.
defineProps<{ reason?: string }>()
const { me } = useMe()
const resent = ref<'idle' | 'sending' | 'sent'>('idle')
async function resend() {
    resent.value = 'sending'
    await $fetch('/api/me/resend-verification', { method: 'POST' }).catch(() => {})
    resent.value = 'sent'
}
</script>

<template>
    <div v-if="me && !me.emailVerified && !me.isPlatformAdmin" class="confirm-note" role="status">
        <span>Please confirm your email: we sent a link to <b>{{ me.email }}</b>. {{ reason ?? 'Until then you can’t email invites or buy a domain.' }}</span>
        <button v-if="resent !== 'sent'" class="btn btn-ghost btn-sm" type="button" :disabled="resent === 'sending'" @click="resend">{{ resent === 'sending' ? 'Sending…' : 'Send the link again' }}</button>
        <span v-else class="muted">Sent. Check your inbox and spam folder.</span>
    </div>
</template>

<style scoped>
.confirm-note { align-items: center; background: var(--paper); border-radius: var(--radius-lg); display: flex; flex-wrap: wrap; font-size: 14px; gap: 12px; justify-content: space-between; padding: 12px 16px; }
</style>
