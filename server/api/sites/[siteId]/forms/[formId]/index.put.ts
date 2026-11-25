import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    const clean = cleanFormInput(await readBody(event))
    if (!clean.fields.length) throw createError({ statusCode: 400, statusMessage: 'A form needs at least one question' })
    const [updated] = await useDb().update(schema.forms).set({ ...clean, updatedAt: new Date() }).where(eq(schema.forms.id, form.id)).returning()
    return toFormDefinition(updated!)
})
