/** Find a domain to buy: the typed name across every ending Slate sells. */
export default defineEventHandler(async (event) => {
    await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { query } = await readBody<{ query?: string }>(event)
    const keyword = domainKeyword(String(query ?? ''))
    if (keyword.length < 2) throw createError({ statusCode: 400, statusMessage: 'Type the name you’d like, like brambleandoak' })
    const checked = await checkDomains(DOMAIN_TLDS.map(t => `${keyword}.${t}`)).catch(() => {
        throw createError({ statusCode: 502, statusMessage: 'We couldn’t check domains just now. Please try again in a minute.' })
    })
    return { keyword, options: checked.map(c => c.option), simulated: !domainRegistrationLive() }
})
