<script setup lang="ts">
// Cloudflare Turnstile: an "are you human" check that's usually invisible. Emits a token that the
// server checks. Renders nothing when no site key is configured.
const emit = defineEmits<{ token: [value: string] }>()
const siteKey = useRuntimeConfig().public.turnstileSiteKey
const el = ref<HTMLElement | null>(null)
let widgetId: string | undefined
// The latest token, and anyone waiting for one (see token())
let current = ''
let waiting: ((t: string) => void)[] = []
function got(t: string) {
    current = t
    emit('token', t)
    if (t) waiting.splice(0).forEach(fn => fn(t))
}

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
            'callback': (token: string) => got(token),
            'expired-callback': () => got(''),
            'error-callback': () => got('')
        })
    }
    start()
})
onBeforeUnmount(() => widgetId && api()?.remove(widgetId))

/** Tokens work once; call after each submit. */
function reset() {
    got('')
    if (widgetId) api()?.reset(widgetId)
}

/**
 * The token, waiting for the check to finish if it hasn't yet (it can take a few seconds,
 * and people with saved passwords press the button straight away). Gives '' after 20 seconds.
 */
function token(): Promise<string> {
    if (!siteKey || current) return Promise.resolve(current)
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            waiting = waiting.filter(fn => fn !== done)
            resolve('')
        }, 20_000)
        const done = (t: string) => {
            clearTimeout(timer)
            resolve(t)
        }
        waiting.push(done)
    })
}
defineExpose({ reset, token, enabled: !!siteKey })
</script>

<template>
    <div v-if="siteKey" ref="el" class="ts" />
</template>

<style scoped>
.ts:empty { display: none; }
</style>
