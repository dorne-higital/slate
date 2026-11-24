import { and, eq, inArray, isNull, ne } from 'drizzle-orm'

/**
 * What deleting this account would do, worked out before anything changes:
 *  - delete: sites only this person works on (soft-deleted, purged after 30 days)
 *  - handOver: sites they pay for that have another owner (billing passes to that owner, who gets a fresh trial)
 *  - leave: sites someone else pays for, which they just leave
 *  - blockers: sites with other people but no other owner (someone must be made owner first)
 */
export async function planAccountDeletion(userId: string) {
    const db = useDb()
    const memberships = await db.select({ siteId: schema.siteMembers.siteId, role: schema.siteMembers.role, name: schema.sites.name, billingUserId: schema.sites.billingUserId })
        .from(schema.siteMembers)
        .innerJoin(schema.sites, eq(schema.sites.id, schema.siteMembers.siteId))
        .where(and(eq(schema.siteMembers.userId, userId), isNull(schema.sites.deletedAt)))
    const siteIds = memberships.map(m => m.siteId)
    const others = siteIds.length
        ? await db.select({ siteId: schema.siteMembers.siteId, userId: schema.siteMembers.userId, role: schema.siteMembers.role })
            .from(schema.siteMembers).where(and(inArray(schema.siteMembers.siteId, siteIds), ne(schema.siteMembers.userId, userId)))
        : []

    const plan = { delete: [] as { id: string, name: string }[], handOver: [] as { id: string, name: string, to: string }[], leave: [] as { id: string, name: string }[], blockers: [] as { id: string, name: string }[] }
    for (const m of memberships) {
        const rest = others.filter(o => o.siteId === m.siteId)
        const otherOwner = rest.find(o => o.role === 'owner')
        if (!rest.length) plan.delete.push({ id: m.siteId, name: m.name })
        else if (m.role === 'owner' && !otherOwner) plan.blockers.push({ id: m.siteId, name: m.name })
        else if (m.billingUserId === userId && otherOwner) plan.handOver.push({ id: m.siteId, name: m.name, to: otherOwner.userId })
        else plan.leave.push({ id: m.siteId, name: m.name })
    }
    return plan
}

/** Cancels every Stripe subscription (plans and domains) the person has, straight away. */
async function cancelSubscriptions(userId: string) {
    const account = await useDb().query.billingAccounts.findFirst({ where: eq(schema.billingAccounts.userId, userId) })
    if (!account?.stripeCustomerId || !stripeConfigured()) return
    const subs = await stripe<{ data: { id: string, status: string }[] }>('GET', 'subscriptions', { customer: account.stripeCustomerId, status: 'all', limit: 100 })
    for (const s of subs.data) {
        if (['canceled', 'incomplete_expired'].includes(s.status)) continue
        await stripe('DELETE', `subscriptions/${s.id}`)
    }
    // Domain auto-renew off too (their subscriptions are cancelled above)
    for (const s of subs.data) await domainSubscriptionEnded(s.id).catch(() => {})
}

export async function deleteAccount(userId: string) {
    const plan = await planAccountDeletion(userId)
    if (plan.blockers.length) return { ok: false as const, plan }
    const db = useDb()
    await cancelSubscriptions(userId)
    if (plan.delete.length) {
        await db.update(schema.sites).set({ deletedAt: new Date(), offline: true, updatedAt: new Date() }).where(inArray(schema.sites.id, plan.delete.map(s => s.id)))
    }
    for (const h of plan.handOver) {
        await startTrial(h.to)
        await db.update(schema.sites).set({ billingUserId: h.to, updatedAt: new Date() }).where(eq(schema.sites.id, h.id))
    }
    // Removes sessions, logins, memberships and the billing record; their pages and posts stay, unattributed.
    // Invoices stay in Stripe, as the law requires for accounts.
    await db.delete(schema.user).where(eq(schema.user.id, userId))
    return { ok: true as const, plan }
}
