/** Make an invitation link (valid 14 days). You can only invite people to roles below your own. */
export default defineEventHandler(async (event) => {
    const { site, user, role: actorRole } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const { role, label } = await readBody<{ role?: SiteRole, label?: string }>(event)
    if (!role || !assignableRoles(actorRole).includes(role)) throw createError({ statusCode: 403, statusMessage: 'Your role can’t invite people as that' })

    const token = inviteToken()
    await useDb().insert(schema.invites).values({
        siteId: site.id,
        token,
        role,
        label: label ? String(label).trim().slice(0, 120) || null : null,
        createdBy: user.id,
        expiresAt: new Date(Date.now() + 14 * 24 * 3600 * 1000)
    })
    return { url: inviteUrl(event, token), people: await loadPeople(site.id, actorRole) }
})
