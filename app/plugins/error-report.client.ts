// Sends errors from this browser to Slate's error log (Admin → Errors). At most 5 per page load, never twice the same.
export default defineNuxtPlugin((nuxtApp) => {
    if (import.meta.dev) return
    const sent = new Set<string>()
    function report(err: unknown) {
        const e = err as { message?: string, stack?: string, reason?: unknown } | undefined
        const message = String(e?.message ?? err ?? '').slice(0, 500)
        if (!message || sent.has(message) || sent.size >= 5) return
        sent.add(message)
        const body = JSON.stringify({ message, stack: String(e?.stack ?? '').slice(0, 3000), path: window.location.pathname })
        try {
            if (!navigator.sendBeacon?.('/api/public/client-error', new Blob([body], { type: 'application/json' }))) {
                fetch('/api/public/client-error', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {})
            }
        } catch { /* never let reporting break the page */ }
    }
    nuxtApp.hook('vue:error', err => report(err))
    window.addEventListener('error', ev => report(ev.error ?? ev.message))
    window.addEventListener('unhandledrejection', ev => report(ev.reason))
})
