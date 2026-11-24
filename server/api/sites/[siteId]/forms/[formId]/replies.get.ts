import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    const status = String(getQuery(event).status ?? 'todo')

    const filters = [eq(schema.formReplies.formId, form.id)]
    if (status === 'todo') filters.push(isNull(schema.formReplies.doneAt))
    if (status === 'done') filters.push(isNotNull(schema.formReplies.doneAt))

    const rows = await useDb().select().from(schema.formReplies).where(and(...filters)).orderBy(desc(schema.formReplies.createdAt)).limit(500)
    return rows.map(toReply)
})
