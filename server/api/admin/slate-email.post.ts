/** Switches on email for slatecms.co.uk, forwarding everything to Dan's private inbox (a Worker secret). */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    try {
        await setUpSlateEmail()
    } catch (err) {
        const e = err as { statusCode?: number, message?: string }
        if (e.statusCode) throw err
        throw createError({ statusCode: 502, statusMessage: `Couldn’t change the email settings: ${e.message ?? 'Cloudflare didn’t answer'}. Try again in a minute.` })
    }
    return slateEmailStatus()
})
