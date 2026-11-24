import { asc, eq } from 'drizzle-orm'

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
