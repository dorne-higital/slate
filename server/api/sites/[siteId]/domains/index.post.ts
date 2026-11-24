import { eq, inArray } from 'drizzle-orm'

/** Connects a domain: registers it (and its www twin) with Cloudflare and records it as pending. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const body = await readBody<{ domain?: string }>(event)
    const host = normaliseDomain(String(body.domain ?? ''))
    if (!host) throw createError({ statusCode: 400, statusMessage: 'That doesn’t look like a domain. Type it like yourbusiness.co.uk' })

    const { appHost, sitesDomain } = useRuntimeConfig().public
    const ours = [stripPort(appHost), stripPort(sitesDomain)]
    if (ours.some(d => host === d || host.endsWith(`.${d}`))) {
        throw createError({ statusCode: 400, statusMessage: 'That’s a Slate address. Use a domain you own.' })
    }

    const hostnames = domainPair(host)
    const db = useDb()
    const taken = await db.select({ hostname: schema.domains.hostname, siteId: schema.domains.siteId }).from(schema.domains).where(inArray(schema.domains.hostname, hostnames))
    if (taken.some(t => t.siteId !== site.id)) {
        throw createError({ statusCode: 409, statusMessage: 'That domain is already connected to another Slate site.' })
    }
    const fresh = hostnames.filter(h => !taken.some(t => t.hostname === h))

    for (const hostname of fresh) {
        const cf = await createCustomHostname(hostname)
        await db.insert(schema.domains).values({ hostname, siteId: site.id, cloudflareId: cf.id, status: 'pending' }).onConflictDoNothing()
    }

    // The first domain a site connects becomes its main one: the one people type, without www
    if (!site.customDomain) {
        await db.update(schema.sites).set({ customDomain: hostnames[0], updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
        site.customDomain = hostnames[0]!
    }
    return await loadSiteDomains(site)
})
