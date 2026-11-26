import { sql } from 'drizzle-orm'

/**
 * Admin → Marketing: visitors to slatecms.co.uk, the waiting list, sign-ups and where they came from,
 * and which of them now pay. ?days=7|30|90 (default 30). Platform admins only; anyone else gets a 404.
 */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const days = [7, 30, 90].includes(Number(getQuery(event).days)) ? Number(getQuery(event).days) : 30
    const db = useDb()
    const since = sql`now() - make_interval(days => ${days})`

    const [visitors, interest, people, accounts] = await Promise.all([
        marketingVisitors(days),
        db.execute<{ name: string | null, email: string, business: string | null, source: VisitSource | null, created_at: string }>(sql`
            select name, email, business, source, created_at from interest_signups order by created_at desc`).then(r => r.rows),
        db.execute<{ id: string, name: string, email: string, source: VisitSource | null, created_at: string, site_id: string | null, site_name: string | null }>(sql`
            select u.id, u.name, u.email, u.signup_source as source, u.created_at,
                (select s.id from sites s where s.billing_user_id = u.id and s.deleted_at is null order by s.created_at limit 1) as site_id,
                (select s.name from sites s where s.billing_user_id = u.id and s.deleted_at is null order by s.created_at limit 1) as site_name
            from "user" u where u.is_platform_admin = false and u.created_at > ${since} order by u.created_at desc`).then(r => r.rows),
        db.execute<typeof schema.billingAccounts.$inferSelect & { user_id: string }>(sql`select * from billing_accounts`).then(r => r.rows)
    ])

    // Who pays now, with the same rules as the rest of billing
    const statusOf = new Map(accounts.map((a) => {
        const r = a as unknown as Record<string, unknown>
        const acc = {
            userId: r.user_id, plan: r.plan, interval: r.interval, status: r.status,
            trialEndsAt: r.trial_ends_at ? new Date(String(r.trial_ends_at)) : null,
            stripeSubscriptionId: r.stripe_subscription_id, cancelAtPeriodEnd: r.cancel_at_period_end
        } as typeof schema.billingAccounts.$inferSelect
        return [String(r.user_id), { status: accountStatus(acc, false), plan: r.plan as string | null }]
    }))
    const paying = (id: string) => ['active', 'past_due'].includes(statusOf.get(id)?.status ?? '')

    const cutoff = Date.now() - days * 86400000
    const recentInterest = interest.filter(i => new Date(i.created_at).getTime() > cutoff)
    const perDay = (dates: string[]) => {
        const counts = new Map<string, number>()
        for (const d of dates) counts.set(d.slice(0, 10), (counts.get(d.slice(0, 10)) ?? 0) + 1)
        return Array.from({ length: days }, (_, i) => {
            const date = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10)
            return { date, n: counts.get(date) ?? 0 }
        })
    }
    const landings = (items: { source: VisitSource | null }[]) => {
        const m = new Map<string, number>()
        for (const i of items) if (i.source?.landing) m.set(i.source.landing, (m.get(i.source.landing) ?? 0) + 1)
        return [...m].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 15)
    }
    const iso = (d: string | Date) => new Date(d).toISOString()
    const trials = people.filter(p => statusOf.get(p.id)?.status === 'trial').length
    const payingCount = people.filter(p => paying(p.id)).length

    return {
        days,
        visitors,
        waitingList: {
            total: interest.length,
            inRange: recentInterest.length,
            perDay: perDay(recentInterest.map(i => iso(i.created_at))),
            sources: tallySources(recentInterest),
            landings: landings(recentInterest),
            recent: recentInterest.slice(0, 25).map(i => ({ name: i.name, email: i.email, business: i.business, at: iso(i.created_at), source: sourceLabel(i.source), landing: i.source?.landing ?? null }))
        },
        signups: {
            inRange: people.length,
            trials,
            paying: payingCount,
            perDay: perDay(people.map(p => iso(p.created_at))),
            sources: tallySources(people.map(p => ({ source: p.source, paying: paying(p.id) }))),
            landings: landings(people),
            recent: people.slice(0, 25).map(p => ({
                name: p.name, email: p.email, at: iso(p.created_at), siteId: p.site_id, siteName: p.site_name,
                source: sourceLabel(p.source), landing: p.source?.landing ?? null,
                status: statusOf.get(p.id)?.status ?? null, plan: statusOf.get(p.id)?.plan ?? null
            }))
        }
    }
})
