import { and, desc, eq, isNull, sql } from 'drizzle-orm'

/** For the overview and sidebar: newest replies and how many are unread. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const db = useDb()
    const [latest, [counts]] = await Promise.all([
        db.select({ reply: schema.formReplies, formName: schema.forms.name })
            .from(schema.formReplies)
            .innerJoin(schema.forms, eq(schema.forms.id, schema.formReplies.formId))
            .where(eq(schema.formReplies.siteId, site.id))
            .orderBy(desc(schema.formReplies.createdAt))
            .limit(3),
        db.select({ unread: sql<number>`count(*)::int` })
            .from(schema.formReplies)
            .where(and(eq(schema.formReplies.siteId, site.id), isNull(schema.formReplies.readAt)))
    ])
    return {
        unread: counts?.unread ?? 0,
        latest: latest.map(r => ({ ...toReply(r.reply), formName: r.formName }))
    }
})
