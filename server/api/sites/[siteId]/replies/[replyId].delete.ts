import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const reply = await requireReply(site.id, getRouterParam(event, 'replyId')!)
    await useDb().delete(schema.formReplies).where(eq(schema.formReplies.id, reply.id))
    return { ok: true }
})
