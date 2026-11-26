/** A visitor sending a form on a client site. The form must belong to the site on this Host. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const form = await requireForm(site.id, getRouterParam(event, 'formId')!)
    return acceptFormReply(event, site, form, await readBody<FormSubmission>(event))
})
