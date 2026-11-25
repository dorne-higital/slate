import { and, eq } from 'drizzle-orm'

export function toOrderItem(o: typeof schema.domainOrders.$inferSelect) {
    return { id: o.id, domain: o.domainName, price: o.price, status: o.status, simulated: o.simulated, expiresAt: o.expiresAt?.toISOString() ?? null, createdAt: o.createdAt.toISOString(), canForward: o.status === 'active' && !o.simulated && !!o.cloudflareZoneId }
}

/**
 * After payment: register at name.com, point its DNS at Slate and connect it to the site.
 * Safe to call more than once (webhook and the return-from-Checkout check can both arrive):
 * only the call that moves the order out of pending_payment does the work.
 */
export async function fulfilDomainOrder(orderId: string, session: Record<string, any>) {
    const db = useDb()
    const [order] = await db.update(schema.domainOrders)
        .set({ status: 'registering', stripeSubscriptionId: session.subscription ?? null, updatedAt: new Date() })
        .where(and(eq(schema.domainOrders.id, orderId), eq(schema.domainOrders.status, 'pending_payment')))
        .returning()
    if (!order) return
    await setUpDomainOrder(order, session)
}

/**
 * Platform admin: try a failed order again. Skips registering if the name is already in
 * Slate's name.com account (the first attempt may have got that far), then does the setup.
 */
export async function retryDomainOrder(orderId: string) {
    const db = useDb()
    const [order] = await db.update(schema.domainOrders)
        .set({ status: 'registering', error: null, updatedAt: new Date() })
        .where(and(eq(schema.domainOrders.id, orderId), eq(schema.domainOrders.status, 'failed')))
        .returning()
    if (!order) throw createError({ statusCode: 409, statusMessage: 'This order isn’t waiting for a retry any more. Refresh the page.' })
    const session = order.stripeSessionId ? await stripe('GET', `checkout/sessions/${order.stripeSessionId}`) : {}
    await setUpDomainOrder(order, session)
}

async function setUpDomainOrder(order: typeof schema.domainOrders.$inferSelect, session: Record<string, any>) {
    const db = useDb()
    const fail = async (message: string) => {
        console.error('[domains] order failed', order.domainName, message)
        await db.update(schema.domainOrders).set({ status: 'failed', error: message.slice(0, 500), updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
        await alertPlatformAdmins(`Domain order failed: ${order.domainName}`, `A customer paid for ${order.domainName} but setting it up failed.\n\n${message}\n\nOrder ${order.id}. Try again from Admin → Domains, or finish it by hand at name.com.`)
    }

    if (order.simulated) {
        // Test mode: no registration, no DNS, no Cloudflare hostname for a name we don't own
        await db.update(schema.domainOrders).set({ status: 'active', expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000), updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
        return
    }

    try {
        const owned = await ownedDomain(order.domainName)
        if (owned) {
            await db.update(schema.domainOrders).set({ expiresAt: owned.expiresAt, updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
        } else {
            const d = session.customer_details ?? {}
            const a = d.address ?? {}
            if (!d.email || !a.line1) throw new Error('No name and address on the Stripe payment to register it with')
            const [firstName, ...rest] = String(d.name ?? 'Domain Owner').trim().split(/\s+/)
            const { expiresAt } = await registerDomain(order.domainName, {
                firstName: firstName!, lastName: rest.join(' ') || firstName!,
                address1: a.line1 ?? '', address2: a.line2 ?? undefined, city: a.city ?? '', state: a.state ?? undefined,
                zip: a.postal_code ?? '', country: a.country ?? 'GB', phone: namecomPhone(d.phone, a.country ?? 'GB'), email: d.email ?? ''
            })
            await db.update(schema.domainOrders).set({ expiresAt, updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
        }
    } catch (err) {
        return fail(`Registration: ${(err as Error).message}`)
    }
    try {
        if (domainZonesEnabled()) {
            // Its own Cloudflare zone: www → Slate, bare domain → https redirect to www (see domainZones.ts)
            await moveDomainToZone(order)
            await db.update(schema.domainOrders).set({ status: 'active', error: null, updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
            return
        }
        await pointDomainAtSlate(order.domainName)
        const site = order.siteId ? await db.query.sites.findFirst({ where: eq(schema.sites.id, order.siteId) }) : null
        if (site && !site.deletedAt) {
            await connectDomain(site, order.domainName)
            // Bare domains need Cloudflare's TXT ownership record (name.com flattens the ANAME); refreshing adds it
            const rows = await db.select().from(schema.domains).where(eq(schema.domains.siteId, site.id))
            await Promise.all(rows.filter(r => r.status !== 'active').map(refreshDomain))
        }
        await db.update(schema.domainOrders).set({ status: 'active', error: null, updatedAt: new Date() }).where(eq(schema.domainOrders.id, order.id))
    } catch (err) {
        // Registered and paid for, but setup needs a hand: keep it visible for a platform admin
        return fail(`Setup after registration: ${(err as Error).message}`)
    }
}

/** The yearly domain subscription ended: stop auto-renewing at name.com. */
export async function domainSubscriptionEnded(subscriptionId: string) {
    const db = useDb()
    const [order] = await db.update(schema.domainOrders).set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(schema.domainOrders.stripeSubscriptionId, subscriptionId)).returning()
    if (order && !order.simulated) await setAutorenew(order.domainName, false).catch(err => console.error('[domains] autorenew off failed', order.domainName, err))
}
