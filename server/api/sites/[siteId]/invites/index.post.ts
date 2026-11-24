import { and, eq, gt, like, sql } from 'drizzle-orm'

/** Make an invitation link (valid 14 days). You can only invite people to roles below your own. */
export default defineEventHandler(async (event) => {
    const { site, user, role: actorRole } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { members, invites } = await loadPeople(site.id, actorRole)
    await requireWithinPlan(site, l => members.length + invites.length < l.peoplePerSite, 'Your plan has room for no more people on this site.')
    const { role, label, email } = await readBody<{ role?: SiteRole, label?: string, email?: string }>(event)
    const to = String(email ?? '').trim().toLowerCase()
    if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw createError({ statusCode: 400, statusMessage: 'That email address doesn’t look right' })
    if (!role || !assignableRoles(actorRole).includes(role)) throw createError({ statusCode: 403, statusMessage: 'Your role can’t invite people as that' })
    if (to) {
        requireVerifiedEmail(user)
        // Stops Slate being used to send bulk email: 20 emailed invites a day per person
        const [sent] = await useDb().select({ n: sql<number>`count(*)::int` }).from(schema.invites)
            .where(and(eq(schema.invites.createdBy, user.id), like(schema.invites.label, '%@%'), gt(schema.invites.createdAt, new Date(Date.now() - 24 * 3600 * 1000))))
        if ((sent?.n ?? 0) >= 20) throw createError({ statusCode: 429, statusMessage: 'You’ve emailed 20 invites today. Make an invite link to share yourself, or try again tomorrow.' })
    }

    const token = inviteToken()
    await useDb().insert(schema.invites).values({
        siteId: site.id,
        token,
        role,
        label: (label ? String(label).trim().slice(0, 120) : '') || to || null,
        createdBy: user.id,
        expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    })
    const url = inviteUrl(event, token)
    const emailed = to ? await sendInviteEmail(to, site.name, user.name, role, url) : false
    return { url, emailed, people: await loadPeople(site.id, actorRole) }
})
