import { eq } from 'drizzle-orm'

/** Deletes a form and every reply to it. Form blocks using it show nothing until another form is picked. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    await useDb().delete(schema.forms).where(eq(schema.forms.id, form.id))
    return { ok: true }
})
