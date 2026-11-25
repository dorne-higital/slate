import { eq } from 'drizzle-orm'

/** Change your own name. (Passwords change through Better Auth's change-password.) */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const { name } = await readBody<{ name?: string }>(event)
    const clean = String(name ?? '').trim().slice(0, 80)
    if (!clean) throw createError({ statusCode: 400, statusMessage: 'Your name can’t be empty' })
    await useDb().update(schema.user).set({ name: clean, updatedAt: new Date() }).where(eq(schema.user.id, user.id))
    return { name: clean }
})
