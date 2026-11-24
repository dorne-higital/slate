import { and, eq, isNull } from 'drizzle-orm'

type Site = typeof schema.sites.$inferSelect
type Account = typeof schema.billingAccounts.$inferSelect

const PAYING = new Set(['active', 'trialing'])

export function accountStatus(account: Account | null | undefined, payerIsAdmin: boolean): BillingStatus {
    if (!account || payerIsAdmin) return 'comped'
    if (account.status && PAYING.has(account.status)) return 'active'
    if (account.status === 'past_due') return 'past_due'
    if (account.trialEndsAt && account.trialEndsAt > new Date() && !account.stripeSubscriptionId) return 'trial'
    return 'expired'
}

export async function loadPayer(userId: string | null) {
    if (!userId) return { account: null, payer: null }
    const db = useDb()
    const [account, payer] = await Promise.all([
        db.query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.userId, userId) }),
        db.query.user.findFirst({ where: eq(schema.user.id, userId), columns: { id: true, name: true, isPlatformAdmin: true } })
    ])
    return { account: account ?? null, payer: payer ?? null }
}

/** The plan a site runs on right now, and its limits. */
export async function siteBilling(site: Site, viewerId?: string): Promise<BillingSummary> {
    if (!site.billingUserId) return summary('comped', null, null, false)
    const { account, payer } = await loadPayer(site.billingUserId)
    const status = accountStatus(account, !!payer?.isPlatformAdmin)
    return summary(status, account, payer?.name ?? null, viewerId === site.billingUserId)
}

function summary(status: BillingStatus, account: Account | null, payerName: string | null, youPay: boolean): BillingSummary {
    const plan = (findPlan(account?.plan)?.key ?? null) as PlanKey | null
    const limits = limitsFor(status, plan)
    return {
        status,
        plan: status === 'trial' ? null : plan,
        interval: (account?.interval as BillingInterval | null) ?? null,
        trialEndsAt: account?.trialEndsAt?.toISOString() ?? null,
        currentPeriodEnd: account?.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: account?.cancelAtPeriodEnd ?? false,
        // Infinity isn't JSON; null means unlimited
        limits: JSON.parse(JSON.stringify(limits, (_, v) => v === Number.POSITIVE_INFINITY ? null : v)),
        payerName,
        youPay
    }
}

/** Visitors can't see a site whose trial ran out with no plan chosen. */
export async function isSitePaused(site: Site) {
    if (!site.billingUserId) return false
    const { account, payer } = await loadPayer(site.billingUserId)
    return accountStatus(account, !!payer?.isPlatformAdmin) === 'expired'
}

/** Throws a friendly 402 when a site's plan doesn't allow something. */
export async function requireWithinPlan(site: Site, check: (limits: PlanLimits) => boolean, message: string) {
    if (!site.billingUserId) return
    const { account, payer } = await loadPayer(site.billingUserId)
    const status = accountStatus(account, !!payer?.isPlatformAdmin)
    if (!check(limitsFor(status, findPlan(account?.plan)?.key ?? null))) {
        throw createError({ statusCode: 402, statusMessage: `${message} Change plan in Billing to do this.` })
    }
}

export async function startTrial(userId: string) {
    await useDb().insert(schema.billingAccounts)
        .values({ userId, trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 3600 * 1000) })
        .onConflictDoNothing()
}

/** Sites billed to this person that still exist. */
export async function billedSiteCount(userId: string) {
    const rows = await useDb().select({ id: schema.sites.id }).from(schema.sites)
        .where(and(eq(schema.sites.billingUserId, userId), isNull(schema.sites.deletedAt)))
    return rows.length
}

/** Copies a Stripe subscription onto the account it belongs to. */
export async function syncSubscription(sub: Record<string, any>) {
    const db = useDb()
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
    const userId = sub.metadata?.userId
        ?? (await db.query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.stripeCustomerId, customerId) }))?.userId
    if (!userId) {
        console.error('[billing] subscription with no account', sub.id)
        return
    }
    const price = sub.items?.data?.[0]?.price
    const match = /^slate_(starter|business|studio)_(monthly|yearly)$/.exec(price?.lookup_key ?? '')
    const ended = ['canceled', 'incomplete_expired'].includes(sub.status)
    await db.insert(schema.billingAccounts).values({ userId }).onConflictDoNothing()
    await db.update(schema.billingAccounts).set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: ended ? null : sub.id,
        status: sub.status,
        plan: match?.[1] ?? null,
        interval: match ? (match[2] === 'monthly' ? 'month' : 'year') : null,
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : null,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
        // Once someone has paid, an ended subscription means paused, not back on trial
        trialEndsAt: ended ? new Date(0) : undefined,
        updatedAt: new Date()
    }).where(eq(schema.billingAccounts.userId, userId))
}

export function appUrl(path: string) {
    const { appHost } = useRuntimeConfig().public
    return `${appHost.startsWith('localhost') ? 'http' : 'https'}://${appHost}${path}`
}

export async function portalUrl(customerId: string, siteId: string) {
    const configuration = useRuntimeConfig().stripePortalConfig || undefined
    const session = await stripe('POST', 'billing_portal/sessions', { customer: customerId, configuration, return_url: appUrl(`/sites/${siteId}/billing`) })
    return session.url as string
}
