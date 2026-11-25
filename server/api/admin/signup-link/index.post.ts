/** A private sign-up link that works for 7 days while Slate is "coming soon". */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const { key, expiresAt } = await makeSignupKey()
    return { url: appUrl(`/signup?key=${encodeURIComponent(key)}`), expiresAt: expiresAt.toISOString() }
})
