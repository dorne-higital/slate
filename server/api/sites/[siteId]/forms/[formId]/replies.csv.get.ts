import { desc, eq } from 'drizzle-orm'

/** Every reply to a form as a CSV file (opens in Excel, Numbers or Google Sheets). */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    const rows = await useDb().select().from(schema.formReplies).where(eq(schema.formReplies.formId, form.id)).orderBy(desc(schema.formReplies.createdAt))

    const filename = `${slugify(form.name) || 'form'}-replies.csv`
    setResponseHeaders(event, {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${filename}"`,
        'cache-control': 'no-store'
    })
    return repliesCsv(form, rows)
})
