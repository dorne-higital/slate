import { asc, eq, sql } from 'drizzle-orm'

/** The site's forms, each with how many replies are new (unread) and still to do. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const rows = await useDb()
        .select({
            form: schema.forms,
            total: sql<number>`(select count(*)::int from form_replies r where r.form_id = "forms"."id")`,
            unread: sql<number>`(select count(*)::int from form_replies r where r.form_id = "forms"."id" and r.read_at is null)`,
            todo: sql<number>`(select count(*)::int from form_replies r where r.form_id = "forms"."id" and r.done_at is null)`
        })
        .from(schema.forms)
        .where(eq(schema.forms.siteId, site.id))
        .orderBy(asc(schema.forms.createdAt))
    return rows.map(r => ({ ...toFormDefinition(r.form), total: r.total, unread: r.unread, todo: r.todo }))
})
