import { asc, eq, inArray } from 'drizzle-orm'

/** Everything the Domains page shows for one site. */
export async function loadSiteDomains(site: typeof schema.sites.$inferSelect) {
    const config = useRuntimeConfig()
    const rows = await useDb().select().from(schema.domains).where(eq(schema.domains.siteId, site.id)).orderBy(asc(schema.domains.createdAt))
    return {
        freeAddress: `${site.slug}.${config.public.sitesDomain}`,
        mainDomain: site.customDomain,
        cnameTarget: config.public.cnameTarget,
        domains: rows.map(d => ({
            hostname: d.hostname,
            status: d.status,
            detail: d.statusDetail,
            isMain: d.hostname === site.customDomain,
            checkedAt: d.checkedAt?.toISOString() ?? null
        }))
    }
}

/** Asks Cloudflare how a domain is doing and saves the answer. */
export async function refreshDomain(row: typeof schema.domains.$inferSelect) {
    const live = row.cloudflareId ? await getCustomHostname(row.cloudflareId) : await findCustomHostname(row.hostname)
    const { status, detail } = summariseHostname(live)
    await useDb().update(schema.domains)
        .set({ status, statusDetail: detail, cloudflareId: live?.id ?? row.cloudflareId, checkedAt: new Date() })
        .where(eq(schema.domains.hostname, row.hostname))
    return status
}

/** The address visitors should use: the main domain once it's live, otherwise the free one. */
export async function liveAddress(site: typeof schema.sites.$inferSelect) {
    if (site.customDomain) {
        const main = await useDb().query.domains.findFirst({ where: eq(schema.domains.hostname, site.customDomain) })
        if (main?.status === 'active') return site.customDomain
    }
    return `${site.slug}.${useRuntimeConfig().public.sitesDomain}`
}

/** Registers a domain (and its www twin) with Cloudflare for SaaS and records it as pending. */
export async function connectDomain(site: typeof schema.sites.$inferSelect, host: string) {
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
}
