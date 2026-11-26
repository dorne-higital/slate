/** Whether hello@slatecms.co.uk (and everything else @slatecms.co.uk) reaches Dan. Never returns the inbox itself. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    return slateEmailStatus()
})
