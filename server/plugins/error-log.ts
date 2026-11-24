// Records every server error (5xx) in error_logs for Admin → Errors. On Workers the write runs after the response via waitUntil.
export default defineNitroPlugin((nitro) => {
    nitro.hooks.hook('error', (error, { event }) => {
        const task = logServerError(error, event)
        const wait = (event as { waitUntil?: (p: Promise<unknown>) => void } | undefined)?.waitUntil
        if (wait) wait.call(event, task)
    })
})
