/** The Mailchimp audiences or Brevo lists a key can see, to choose from. Leave apiKey out to use the saved key. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { key, apiKey } = await readBody<{ key?: string, apiKey?: string }>(event)
    if (key !== 'mailchimp' && key !== 'brevo') throw createError({ statusCode: 400, statusMessage: 'Unknown integration' })
    const useKey = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : site.connections?.[key]?.apiKey
    if (!useKey) throw createError({ statusCode: 400, statusMessage: 'Paste your API key first.' })
    const lists = await emailLists(key, useKey)
    if (!lists.length) throw createError({ statusCode: 400, statusMessage: key === 'mailchimp' ? 'That account has no audiences yet. Make one in Mailchimp first.' : 'That account has no lists yet. Make one in Brevo under Contacts › Lists.' })
    return lists
})
