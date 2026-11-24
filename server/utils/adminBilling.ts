import { and, asc, eq, inArray } from 'drizzle-orm'

type Site = typeof schema.sites.$inferSelect

/** Who a platform admin bills for a site: its payer, or (if Slate covers it) its first owner who isn't an admin. */
export async function billableUser(site: Site) {
    const db = useDb()
    if (site.billingUserId) {
        const u = await db.query.user.findFirst({ where: eq(schema.user.id, site.billingUserId), columns: { id: true, name: true, email: true, isPlatformAdmin: true } })
        if (u && !u.isPlatformAdmin) return { user: u, isPayer: true }
    }
    const owners = await db.select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, isPlatformAdmin: schema.user.isPlatformAdmin })
        .from(schema.siteMembers).innerJoin(schema.user, eq(schema.user.id, schema.siteMembers.userId))
        .where(and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.role, 'owner')))
        .orderBy(asc(schema.siteMembers.createdAt))
    const owner = owners.find(o => !o.isPlatformAdmin)
    return owner ? { user: owner, isPayer: false } : null
}

export async function ensureCustomer(user: { id: string, name: string, email: string }) {
    const db = useDb()
    await db.insert(schema.billingAccounts).values({ userId: user.id }).onConflictDoNothing()
    const account = await db.query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.userId, user.id) })
    if (account?.stripeCustomerId) return account.stripeCustomerId
    const customer = await adminStripe('POST', 'customers', { email: user.email, name: user.name, metadata: { userId: user.id } })
    await db.update(schema.billingAccounts).set({ stripeCustomerId: customer.id, updatedAt: new Date() }).where(eq(schema.billingAccounts.userId, user.id))
    return customer.id as string
}

async function listPrice(plan: PlanKey, interval: BillingInterval) {
    const prices = await adminStripe<{ data: { id: string, product: string }[] }>('GET', 'prices', { lookup_keys: [priceLookupKey(plan, interval)], active: true })
    if (!prices.data[0]) throw createError({ statusCode: 503, statusMessage: 'That plan has no price in Stripe. Run yarn stripe:setup.' })
    return prices.data[0]
}

/** Swaps the plan line of a live subscription to another price, from the next payment (no part-month charges). */
async function swapPlanPrice(subscriptionId: string, priceId: string, interval: BillingInterval) {
    const sub = await adminStripe('GET', `subscriptions/${subscriptionId}`)
    const items = (sub.items?.data ?? []) as Record<string, any>[]
    const planItem = items.find(i => /^slate_(starter|business|studio)_/.test(i.price?.lookup_key ?? '') || i.price?.metadata?.slate_plan)
    if (!planItem) return
    if (items.length > 1 && planItem.price?.recurring?.interval !== interval) {
        throw createError({ statusCode: 400, statusMessage: `They pay ${planItem.price?.recurring?.interval}ly with extra sites, so the price must be ${planItem.price?.recurring?.interval}ly too.` })
    }
    await adminStripe('POST', `subscription_items/${planItem.id}`, { price: priceId, proration_behavior: 'none' })
    await syncSubscription(await adminStripe('GET', `subscriptions/${subscriptionId}`))
}

/**
 * Gives the person billed for a site a special price for a plan. If Slate covered the site, its owner becomes the payer
 * (with a trial, so nothing changes for them until they pick their plan in Billing, where the special price is offered).
 */
export async function setSpecialPrice(site: Site, plan: PlanKey, interval: BillingInterval, amount: number) {
    const who = await billableUser(site)
    if (!who) throw createError({ statusCode: 400, statusMessage: 'This site has no owner to bill. Invite the client as an owner first.' })
    const db = useDb()
    if (!who.isPayer) {
        await db.update(schema.sites).set({ billingUserId: who.user.id, updatedAt: new Date() }).where(eq(schema.sites.id, site.id))
        await startTrial(who.user.id)
    }
    await ensureCustomer(who.user)
    const account = (await db.query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.userId, who.user.id) }))!
    const base = await listPrice(plan, interval)
    const price = await adminStripe('POST', 'prices', {
        product: base.product, unit_amount: amount, currency: 'gbp', recurring: { interval },
        nickname: `Special price for ${who.user.email}`, metadata: { slate_plan: plan, slate_special: '1', userId: who.user.id }
    })
    if (account.stripeSubscriptionId && accountStatus(account, false) !== 'expired') await swapPlanPrice(account.stripeSubscriptionId, price.id, interval)
    if (account.customPriceId) await adminStripe('POST', `prices/${account.customPriceId}`, { active: false })
    await db.update(schema.billingAccounts).set({ customPriceId: price.id, customPlan: plan, customInterval: interval, customAmount: amount, updatedAt: new Date() })
        .where(eq(schema.billingAccounts.userId, who.user.id))
    if (account.stripeSubscriptionId) await syncExtraSites(who.user.id)
    return who.user
}

/** Back to list prices. A live subscription moves to the list price from its next payment. */
export async function clearSpecialPrice(userId: string) {
    const db = useDb()
    const account = await db.query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.userId, userId) })
    if (!account?.customPriceId) return
    if (account.stripeSubscriptionId) {
        const plan = (findPlan(account.plan)?.key ?? account.customPlan) as PlanKey
        const interval = (account.interval ?? account.customInterval) as BillingInterval
        await swapPlanPrice(account.stripeSubscriptionId, (await listPrice(plan, interval)).id, interval)
    }
    await adminStripe('POST', `prices/${account.customPriceId}`, { active: false })
    await db.update(schema.billingAccounts).set({ customPriceId: null, customPlan: null, customInterval: null, customAmount: null, updatedAt: new Date() })
        .where(eq(schema.billingAccounts.userId, userId))
}

export function toAdminInvoice(r: typeof schema.customInvoices.$inferSelect) {
    return { id: r.id, siteId: r.siteId, number: r.number, description: r.description, total: r.total, status: r.status, hostedUrl: r.hostedUrl, pdfUrl: r.pdfUrl, dueAt: r.dueAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString() }
}

/** Re-reads invoices that could still change (open ones) from Stripe. */
export async function refreshInvoices(rows: (typeof schema.customInvoices.$inferSelect)[]) {
    const open = rows.filter(r => r.status === 'open').slice(0, 20)
    await Promise.all(open.map(async (r) => {
        const inv = await stripe('GET', `invoices/${r.stripeInvoiceId}`).catch(() => null)
        if (inv && inv.status !== r.status) {
            r.status = inv.status
            await useDb().update(schema.customInvoices).set({ status: inv.status }).where(eq(schema.customInvoices.id, r.id))
        }
    }))
    return rows
}

export async function customInvoicesFor(siteIds?: string[]) {
    const db = useDb()
    const q = db.select().from(schema.customInvoices)
    const rows = siteIds ? await q.where(inArray(schema.customInvoices.siteId, siteIds)) : await q
    return (await refreshInvoices(rows.sort((a, b) => +b.createdAt - +a.createdAt))).map(toAdminInvoice)
}

export function toDiscount(p: Record<string, any>) {
    const c = p.coupon ?? {}
    return {
        id: p.id as string,
        code: p.code as string,
        active: !!p.active,
        used: p.times_redeemed ?? 0,
        maxUses: p.max_redemptions ?? null,
        expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null,
        percentOff: c.percent_off ?? null,
        amountOff: c.amount_off ?? null,
        duration: c.duration as 'once' | 'forever' | 'repeating',
        months: c.duration_in_months ?? null
    }
}
