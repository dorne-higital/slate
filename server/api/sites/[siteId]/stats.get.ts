import { sql } from 'drizzle-orm'

/** Counts for the Overview tiles, plus the most recently edited pages and posts. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const id = site.id
    const db = useDb()
    const n = (q: ReturnType<typeof sql>) => db.execute<{ n: number }>(q).then(r => Number(r.rows[0]?.n ?? 0))
    const [pages, published, changed, postsLive, postsScheduled, postsDraft, forms, replies, toDo, replies7, mediaCount, mediaBytes, people, invites, domains, domainsLive, recent] = await Promise.all([
        n(sql`select count(*)::int n from pages where site_id = ${id}`),
        n(sql`select count(*)::int n from pages where site_id = ${id} and status = 'published'`),
        n(sql`select count(*)::int n from pages where site_id = ${id} and status = 'published' and blocks::text is distinct from published_blocks::text`),
        n(sql`select count(*)::int n from posts where site_id = ${id} and status = 'published' and published_at <= now()`),
        n(sql`select count(*)::int n from posts where site_id = ${id} and status = 'published' and published_at > now()`),
        n(sql`select count(*)::int n from posts where site_id = ${id} and status = 'draft'`),
        n(sql`select count(*)::int n from forms where site_id = ${id}`),
        n(sql`select count(*)::int n from form_replies where site_id = ${id}`),
        n(sql`select count(*)::int n from form_replies where site_id = ${id} and done_at is null`),
        n(sql`select count(*)::int n from form_replies where site_id = ${id} and created_at > now() - interval '7 days'`),
        n(sql`select count(*)::int n from media where site_id = ${id}`),
        n(sql`select coalesce(sum(size), 0)::bigint n from media where site_id = ${id}`),
        n(sql`select count(*)::int n from site_members where site_id = ${id}`),
        n(sql`select count(*)::int n from invites where site_id = ${id} and accepted_at is null and expires_at > now()`),
        n(sql`select count(*)::int n from domains where site_id = ${id} and hostname not like 'www.%'`),
        n(sql`select count(*)::int n from domains where site_id = ${id} and hostname not like 'www.%' and status = 'active'`),
        db.execute<{ kind: 'page' | 'post', id: string, title: string, sub: string, updated_at: string, by: string | null }>(sql`
            (select 'page' as kind, p.id, p.title, p.path as sub, p.updated_at, u.name as by from pages p left join "user" u on u.id = p.updated_by where p.site_id = ${id} order by p.updated_at desc limit 8)
            union all
            (select 'post' as kind, p.id, p.title, '/blog/' || p.slug as sub, p.updated_at, u.name as by from posts p left join "user" u on u.id = p.author_id where p.site_id = ${id} order by p.updated_at desc limit 8)
            order by updated_at desc limit 8`).then(r => r.rows)
    ])
    return {
        pages: { total: pages, published, drafts: pages - published, changed },
        posts: { live: postsLive, scheduled: postsScheduled, drafts: postsDraft },
        forms: { forms, replies, toDo, last7: replies7 },
        media: { files: mediaCount, bytes: mediaBytes },
        people: { members: people, invites },
        domains: { connected: domains, live: domainsLive },
        recent: recent.map(r => ({ kind: r.kind, id: r.id, title: r.title, sub: r.sub, updatedAt: new Date(r.updated_at).toISOString(), by: r.by }))
    }
})
