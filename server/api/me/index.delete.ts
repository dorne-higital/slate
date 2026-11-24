import { and, eq } from 'drizzle-orm'

/** Deletes the signed-in person's account. Needs their password. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (user.isPlatformAdmin) throw createError({ statusCode: 400, statusMessage: 'Platform admin accounts can’t be deleted here. Ask another admin to remove your admin access first.' })
    const { password } = await readBody<{ password?: string }>(event)

    const login = await useDb().query.account.findFirst({ where: and(eq(schema.account.userId, user.id), eq(schema.account.providerId, 'credential')) })
    const ctx = await useAuth().$context
    if (!login?.password || !password || !await ctx.password.verify({ hash: login.password, password })) {
        throw createError({ statusCode: 400, statusMessage: 'That password isn’t right.' })
    }
    const result = await deleteAccount(user.id)
    if (!result.ok) {
        throw createError({ statusCode: 409, statusMessage: `Make someone else an owner of ${result.plan.blockers.map(b => b.name).join(', ')} first, or remove the other people from it.` })
    }
    deleteCookie(event, 'better-auth.session_token')
    deleteCookie(event, '__Secure-better-auth.session_token')
    return { ok: true }
})
