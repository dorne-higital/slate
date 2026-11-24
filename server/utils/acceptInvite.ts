import { and, eq, gt, isNull } from 'drizzle-orm'

/** A usable invite: not accepted, not expired, site not deleted. */
export async function findOpenInvite(token: string) {
    if (!/^[\w-]{20,64}$/.test(token)) return null
    const db = useDb()
    const invite = await db.query.invites.findFirst({
        where: and(eq(schema.invites.token, token), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date()))
    })
    if (!invite) return null
    const site = await db.query.sites.findFirst({ where: eq(schema.sites.id, invite.siteId) })
    if (!site || site.deletedAt) return null
    return { invite, site }
}

/**
 * Adds the user to the invite's site. Someone already on the site keeps the higher of their
 * current role and the invited one. The invite can't be used again.
 */
export async function acceptInvite(token: string, userId: string) {
    const found = await findOpenInvite(token)
    if (!found) throw createError({ statusCode: 410, statusMessage: 'This invitation has expired or has already been used. Ask for a new link.' })
    const { invite, site } = found
    const db = useDb()

    // Claim the invite first so two people can't use the same link at once
    const claimed = await db.update(schema.invites)
        .set({ acceptedAt: new Date(), acceptedBy: userId })
        .where(and(eq(schema.invites.id, invite.id), isNull(schema.invites.acceptedAt)))
        .returning({ id: schema.invites.id })
    if (!claimed.length) throw createError({ statusCode: 410, statusMessage: 'This invitation has already been used. Ask for a new link.' })

    const existing = await db.query.siteMembers.findFirst({ where: and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)) })
    if (!existing) {
        await db.insert(schema.siteMembers).values({ siteId: site.id, userId, role: invite.role })
    } else if (ROLE_RANK[invite.role] > ROLE_RANK[existing.role]) {
        await db.update(schema.siteMembers).set({ role: invite.role }).where(and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)))
    }
    return { siteId: site.id }
}
