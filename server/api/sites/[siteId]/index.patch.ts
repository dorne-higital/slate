import { eq } from 'drizzle-orm'

/** General settings: site name, reply email, and taking the site offline. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const b = await readBody<{ name?: string, replyEmail?: string | null, offline?: boolean }>(event)
    const set: Partial<typeof schema.sites.$inferInsert> = { updatedAt: new Date() }

    if (b.name !== undefined) {
        const name = String(b.name).trim().slice(0, 80)
        if (!name) throw createError({ statusCode: 400, statusMessage: 'Your site needs a name' })
        set.name = name
    }
    if (b.replyEmail !== undefined) {
        const email = String(b.replyEmail ?? '').trim().toLowerCase()
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw createError({ statusCode: 400, statusMessage: 'That email address doesn’t look right' })
        set.replyEmail = email || null
    }
    if (b.offline !== undefined) set.offline = b.offline === true

    const [updated] = await useDb().update(schema.sites).set(set).where(eq(schema.sites.id, site.id)).returning()
    return { name: updated!.name, replyEmail: updated!.replyEmail, offline: updated!.offline }
})
