/** Sends the "confirm your email" link again, to the signed-in person's own address only. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (user.emailVerified) return { sent: false, alreadyConfirmed: true }
    await useAuth().api.sendVerificationEmail({ body: { email: user.email, callbackURL: '/sites?verified=1' } })
    return { sent: true }
})
