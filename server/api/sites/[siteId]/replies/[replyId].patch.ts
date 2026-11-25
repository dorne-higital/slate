import { eq } from 'drizzle-orm'

/** Mark read, mark done / not done, or save the private note. Reading is open to anyone on the site. */
export default defineEventHandler(async (event) => {
    const body = await readBody<{ read?: boolean, done?: boolean, note?: string }>(event)
    const changesContent = body.done !== undefined || body.note !== undefined
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, changesContent ? 'editor' : 'viewer')
    const reply = await requireReply(site.id, getRouterParam(event, 'replyId')!)

    const set: Partial<typeof schema.formReplies.$inferInsert> = {}
    if (body.read !== undefined) set.readAt = body.read ? (reply.readAt ?? new Date()) : null
    if (body.done !== undefined) set.doneAt = body.done ? new Date() : null
    if (body.note !== undefined) set.note = String(body.note).slice(0, 5000) || null
    if (!Object.keys(set).length) return toReply(reply)

    const [updated] = await useDb().update(schema.formReplies).set(set).where(eq(schema.formReplies.id, reply.id)).returning()
    return toReply(updated!)
})
