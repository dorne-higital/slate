import { eq } from 'drizzle-orm'

/** Clears a kind of error once it's fixed. If it happens again it comes back (and emails again). */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const fp = String(getRouterParam(event, 'fingerprint'))
    if (!/^[0-9a-f]{16}$/.test(fp)) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    await useDb().delete(schema.errorLogs).where(eq(schema.errorLogs.fingerprint, fp))
    return { ok: true }
})
