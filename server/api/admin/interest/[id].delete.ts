import { eq } from 'drizzle-orm'

/** Remove someone from the interest list (e.g. they asked to be taken off). */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const id = String(getRouterParam(event, 'id'))
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    await useDb().delete(schema.interestSignups).where(eq(schema.interestSignups.id, id))
    return { ok: true }
})
