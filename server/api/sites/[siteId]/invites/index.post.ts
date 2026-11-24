/** Make an invitation link (valid 14 days). You can only invite people to roles below your own. */
export default defineEventHandler(async (event) => {
    const { site, user, role: actorRole } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { members, invites } = await loadPeople(site.id, actorRole)
    await requireWithinPlan(site, l => members.length + invites.length < l.peoplePerSite, 'Your plan has room for no more people on this site.')
    const { role, label, email } = await readBody<{ role?: SiteRole, label?: string, email?: string }>(event)
    const to = String(email ?? '').trim().toLowerCase()
    if (to && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) throw createError({ statusCode: 400, statusMessage: 'That email address doesn’t look right' })
    if (!role || !assignableRoles(actorRole).includes(role)) throw createError({ statusCode: 403, statusMessage: 'Your role can’t invite people as that' })

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
