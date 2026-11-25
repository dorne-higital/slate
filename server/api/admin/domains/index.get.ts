import { sql } from 'drizzle-orm'

/** Every domain bought through Slate, failed ones first. Platform admins only. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const rows = await useDb().execute<{ id: string, domain_name: string, price: number, status: DomainOrderStatus, simulated: boolean, error: string | null, expires_at: string | null, created_at: string, updated_at: string, site_id: string | null, site: string | null, owner: string | null, email: string | null }>(sql`
        select o.id, o.domain_name, o.price, o.status, o.simulated, o.error, o.expires_at, o.created_at, o.updated_at,
            s.id as site_id, s.name as site, u.name as owner, u.email
        from domain_orders o left join sites s on s.id = o.site_id left join "user" u on u.id = o.user_id
        where o.status <> 'pending_payment' or o.created_at > now() - interval '1 day'
        order by (o.status = 'failed') desc, o.created_at desc
        limit 300`)
    return rows.rows.map(r => ({
        id: r.id, domain: r.domain_name, price: r.price, status: r.status, simulated: r.simulated, error: r.error,
        expiresAt: r.expires_at ? new Date(r.expires_at).toISOString() : null,
        createdAt: new Date(r.created_at).toISOString(), updatedAt: new Date(r.updated_at).toISOString(),
        siteId: r.site_id, site: r.site, owner: r.owner, email: r.email
    }))
})
