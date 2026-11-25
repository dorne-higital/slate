import { and, asc, eq, inArray } from 'drizzle-orm'

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
            checkedAt: d.checkedAt?.toISOString() ?? null,
            verify: d.status !== 'active' && d.verifyName && d.verifyValue ? { name: d.verifyName, value: d.verifyValue } : null
        }))
    }
}

/** Asks Cloudflare how a domain is doing and saves the answer. */
export async function refreshDomain(row: typeof schema.domains.$inferSelect) {
    const live = row.cloudflareId ? await getCustomHostname(row.cloudflareId) : await findCustomHostname(row.hostname)
    const { status, detail } = summariseHostname(live)
    const verify = status === 'active' ? null : ownershipRecord(live)
    await useDb().update(schema.domains)
        .set({ status, statusDetail: detail, cloudflareId: live?.id ?? row.cloudflareId, verifyName: verify?.name ?? null, verifyValue: verify?.value ?? null, checkedAt: new Date() })
        .where(eq(schema.domains.hostname, row.hostname))
    // A domain we registered: we run its DNS, so add the ownership record ourselves
    if (verify && status === 'pending') await addVerifyRecordIfOurs(row.hostname, verify).catch(err => console.error('[domains] TXT record', row.hostname, (err as Error).message))
    return status
}

async function addVerifyRecordIfOurs(hostname: string, verify: { name: string, value: string }) {
    const apex = hostname.replace(/^www\./, '')
    const order = await useDb().query.domainOrders.findFirst({ where: and(eq(schema.domainOrders.domainName, apex), eq(schema.domainOrders.simulated, false), inArray(schema.domainOrders.status, ['active', 'cancelled'])) })
    if (!order || !verify.name.endsWith(apex)) return
    const host = verify.name.slice(0, -apex.length).replace(/\.$/, '')
    await ensureTxtRecord(apex, host, verify.value)
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
