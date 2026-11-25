import { sql } from 'drizzle-orm'

/** Platform dashboard numbers. Platform admins only; anyone else gets a 404. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    if (!user.isPlatformAdmin) throw createError({ statusCode: 404, statusMessage: 'Not found' })
    const db = useDb()
    const one = async <T = number>(q: ReturnType<typeof sql>) => (await db.execute<{ n: T }>(q)).rows[0]?.n as T

    const supportOpen = await one(sql`select count(*)::int n from support_tickets where status = 'open'`)
    const urgentBugs = await one(sql`select count(*)::int n from support_tickets where status = 'open' and severity = 'p1'`)
    // The newer checks: errors today, overdue invoices, backups, trials about to end
    const [errorKinds, overdue, trialsEnding, backups] = await Promise.all([
        one(sql`select count(distinct fingerprint)::int n from error_logs where created_at > now() - interval '24 hours'`),
        db.execute<{ number: string | null, total: number, due_at: string, site: string | null }>(sql`
            select i.number, i.total, i.due_at, s.name as site from custom_invoices i left join sites s on s.id = i.site_id
            where i.status = 'open' and i.due_at < now() order by i.due_at limit 5`).then(r => r.rows),
        db.execute<{ name: string, email: string, trial_ends_at: string, site: string | null, site_id: string | null }>(sql`
            select u.name, u.email, b.trial_ends_at,
                (select s.name from sites s where s.billing_user_id = u.id and s.deleted_at is null order by s.created_at limit 1) as site,
                (select s.id from sites s where s.billing_user_id = u.id and s.deleted_at is null order by s.created_at limit 1) as site_id
            from billing_accounts b join "user" u on u.id = b.user_id
            where b.stripe_subscription_id is null and u.is_platform_admin = false
              and b.trial_ends_at between now() and now() + interval '3 days'
            order by b.trial_ends_at limit 5`).then(r => r.rows),
        listBackups().catch(() => [] as BackupInfo[])
    ])
    const lastBackup = backups[0] ? new Date(backups[0].createdAt) : null
    const backupStale = !lastBackup || Date.now() - lastBackup.getTime() > 4 * 24 * 3600 * 1000
    const [accounts, sitesLive, sitesOffline, sitesDeleted, sites7, users, users7, users30, domainsActive, domainsPending, domainsError, ordersActive, ordersFailed, orderRevenue, replies7, published7, signupDays, recentUsers, failedOrders, pastDue, errorDomains] = await Promise.all([
        db.execute<{ user_id: string, plan: string | null, interval: string | null, status: string | null, trial_ends_at: string | null, stripe_subscription_id: string | null, cancel_at_period_end: boolean, is_platform_admin: boolean, sites: number }>(sql`
            select b.user_id, b.plan, b.interval, b.status, b.trial_ends_at, b.stripe_subscription_id, b.cancel_at_period_end, u.is_platform_admin,
                (select count(*)::int from sites s where s.billing_user_id = b.user_id and s.deleted_at is null) as sites
            from billing_accounts b join "user" u on u.id = b.user_id`).then(r => r.rows),
        one(sql`select count(*)::int n from sites where deleted_at is null and offline = false`),
        one(sql`select count(*)::int n from sites where deleted_at is null and offline = true`),
        one(sql`select count(*)::int n from sites where deleted_at is not null`),
        one(sql`select count(*)::int n from sites where deleted_at is null and created_at > now() - interval '7 days'`),
        one(sql`select count(*)::int n from "user"`),
        one(sql`select count(*)::int n from "user" where created_at > now() - interval '7 days'`),
        one(sql`select count(*)::int n from "user" where created_at > now() - interval '30 days'`),
        one(sql`select count(*)::int n from domains where status = 'active' and hostname not like 'www.%'`),
        one(sql`select count(*)::int n from domains where status = 'pending' and hostname not like 'www.%'`),
        one(sql`select count(*)::int n from domains where status = 'error'`),
        one(sql`select count(*)::int n from domain_orders where status = 'active' and simulated = false`),
        one(sql`select count(*)::int n from domain_orders where status = 'failed'`),
        one(sql`select coalesce(sum(price), 0)::int n from domain_orders where status = 'active' and simulated = false`),
        one(sql`select count(*)::int n from form_replies where created_at > now() - interval '7 days'`),
        one(sql`select count(*)::int n from pages where published_at > now() - interval '7 days'`),
        db.execute<{ day: string, n: number }>(sql`
            select to_char(d, 'YYYY-MM-DD') as day, (select count(*)::int from "user" u where u.created_at::date = d::date) as n
            from generate_series(current_date - interval '29 days', current_date, interval '1 day') d order by d`).then(r => r.rows),
        db.execute<{ name: string, email: string, created_at: string, site_name: string | null, site_id: string | null }>(sql`
            select u.name, u.email, u.created_at,
                (select s.name from sites s where s.billing_user_id = u.id order by s.created_at limit 1) as site_name,
                (select s.id from sites s where s.billing_user_id = u.id and s.deleted_at is null order by s.created_at limit 1) as site_id
            from "user" u order by u.created_at desc limit 6`).then(r => r.rows),
        db.execute<{ domain_name: string, error: string | null, created_at: string }>(sql`select domain_name, error, created_at from domain_orders where status = 'failed' order by created_at desc limit 5`).then(r => r.rows),
        db.execute<{ name: string, email: string }>(sql`select u.name, u.email from billing_accounts b join "user" u on u.id = b.user_id where b.status = 'past_due' limit 5`).then(r => r.rows),
        db.execute<{ hostname: string, status_detail: string | null }>(sql`select hostname, status_detail from domains where status = 'error' limit 5`).then(r => r.rows)
    ])

    // Plans and revenue, using the same rules as the rest of billing
    const plans = { trial: 0, expired: 0, pastDue: 0, cancelling: 0, starter: 0, business: 0, studio: 0 }
    let mrr = 0
    for (const a of accounts) {
        if (a.is_platform_admin || !a.sites) continue
        const status = accountStatus({
            userId: a.user_id, plan: a.plan, interval: a.interval, status: a.status, trialEndsAt: a.trial_ends_at ? new Date(a.trial_ends_at) : null,
            stripeSubscriptionId: a.stripe_subscription_id, cancelAtPeriodEnd: a.cancel_at_period_end
        } as typeof schema.billingAccounts.$inferSelect, false)
        if (status === 'trial') plans.trial++
        else if (status === 'expired') plans.expired++
        else {
            if (status === 'past_due') plans.pastDue++
            if (a.cancel_at_period_end) plans.cancelling++
            const p = findPlan(a.plan)
            if (p) {
                plans[p.key]++
                mrr += a.interval === 'year' ? Math.round(p.yearly / 12) : p.monthly
            }
        }
    }
    const paying = plans.starter + plans.business + plans.studio

    return {
        live: stripeIsLive(),
        sites: { live: sitesLive, offline: sitesOffline, deleted: sitesDeleted, new7: sites7 },
        people: { total: users, new7: users7, new30: users30 },
        billing: { ...plans, paying, mrr, domainRevenueYear: orderRevenue },
        domains: { active: domainsActive, pending: domainsPending, error: domainsError, bought: ordersActive, failedOrders: ordersFailed },
        activity: { replies7, published7 },
        support: { open: supportOpen },
        signups: signupDays.map(d => ({ day: d.day, n: Number(d.n) })),
        recentUsers: recentUsers.map(u => ({ name: u.name, email: u.email, createdAt: new Date(u.created_at).toISOString(), siteName: u.site_name, siteId: u.site_id })),
        attention: [
            ...(urgentBugs ? [{ kind: 'p1', text: `${urgentBugs} urgent ${urgentBugs === 1 ? 'problem' : 'problems'} reported (P1)`, detail: 'A customer says their site is down or Slate isn’t working', link: '/admin/support' }] : []),
            ...(supportOpen ? [{ kind: 'support', text: `${supportOpen} support ${supportOpen === 1 ? 'ticket needs' : 'tickets need'} a reply`, detail: 'Open Support to answer', link: '/admin/support' }] : []),
            ...(errorKinds ? [{ kind: 'errors', text: `${errorKinds} kind${errorKinds === 1 ? '' : 's'} of error in the last 24 hours`, detail: 'See what went wrong and clear the ones you’ve fixed', link: '/admin/errors' }] : []),
            ...(backupStale ? [{ kind: 'backup', text: lastBackup ? 'The last backup is more than 4 days old' : 'There are no backups yet', detail: lastBackup ? `Last one ${lastBackup.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Check Errors for why, then back up now.` : 'Press Back up now to make the first one', link: '/admin/backups' }] : []),
            ...overdue.map(i => ({ kind: 'invoice', text: `Invoice ${i.number ?? ''} for ${formatPence(i.total)} is overdue`.replace('  ', ' '), detail: `${i.site ?? 'A site'} · was due ${new Date(i.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, link: '/admin/billing' })),
            ...failedOrders.map(o => ({ kind: 'domain-order', text: `Paid domain ${o.domain_name} didn’t finish setting up`, detail: o.error ?? '', link: '/admin/domains' })),
            ...pastDue.map(p => ({ kind: 'past-due', text: `${p.name}’s last payment failed`, detail: p.email })),
            ...trialsEnding.map(t => ({ kind: 'trial', text: `${t.name}’s trial ends ${new Date(t.trial_ends_at).toLocaleDateString('en-GB', { weekday: 'long' })}`, detail: `${t.email}${t.site ? ` · ${t.site}` : ''}. A good time to check in.`, link: t.site_id ? `/sites/${t.site_id}` : undefined })),
            ...errorDomains.map(d => ({ kind: 'domain', text: `${d.hostname} has a problem`, detail: d.status_detail ?? '' }))
        ]
    }
})
