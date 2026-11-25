<script setup lang="ts">
// Cloudflare Turnstile: an "are you human" check that's usually invisible. Emits a token that the
// server checks. Renders nothing when no site key is configured.
const emit = defineEmits<{ token: [value: string] }>()
const siteKey = useRuntimeConfig().public.turnstileSiteKey
const el = ref<HTMLElement | null>(null)
let widgetId: string | undefined

interface Turnstile {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string
    reset: (id?: string) => void
    remove: (id?: string) => void
}
const api = () => (window as unknown as { turnstile?: Turnstile }).turnstile

if (siteKey) useHead({ script: [{ key: 'turnstile', src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', async: true, defer: true }] })

onMounted(() => {
    if (!siteKey) return
    const start = () => {
        const t = api()
        if (!t || !el.value) return setTimeout(start, 150)
        widgetId = t.render(el.value, {
            'sitekey': siteKey,
            'appearance': 'interaction-only',
            'callback': (token: string) => emit('token', token),
            'expired-callback': () => emit('token', ''),
            'error-callback': () => emit('token', '')
        })
    }
    start()
})
onBeforeUnmount(() => widgetId && api()?.remove(widgetId))

/** Tokens work once; call after each submit. */
function reset() {
    emit('token', '')
    if (widgetId) api()?.reset(widgetId)
}
defineExpose({ reset, enabled: !!siteKey })
</script>

<template>
    <div v-if="siteKey" ref="el" class="ts" />
</template>

<style scoped>
.ts:empty { display: none; }
</style>
