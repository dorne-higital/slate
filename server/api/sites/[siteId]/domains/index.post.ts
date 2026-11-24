/** Connects a domain: registers it (and its www twin) with Cloudflare and records it as pending. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const body = await readBody<{ domain?: string }>(event)
    const host = normaliseDomain(String(body.domain ?? ''))
    if (!host) throw createError({ statusCode: 400, statusMessage: 'That doesn’t look like a domain. Type it like yourbusiness.co.uk' })

    await connectDomain(site, host)
    return await loadSiteDomains(site)
})
