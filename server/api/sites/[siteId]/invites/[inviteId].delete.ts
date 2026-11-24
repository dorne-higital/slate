import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
    const { site, role } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const id = getRouterParam(event, 'inviteId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
    const invite = await useDb().query.invites.findFirst({ where: and(eq(schema.invites.id, id), eq(schema.invites.siteId, site.id)) })
    if (!invite) throw createError({ statusCode: 404, statusMessage: 'Invite not found' })
    if (!canManage(role, invite.role)) throw createError({ statusCode: 403, statusMessage: 'Your role can’t cancel that invite' })
    await useDb().delete(schema.invites).where(eq(schema.invites.id, id))
    return await loadPeople(site.id, role)
})
