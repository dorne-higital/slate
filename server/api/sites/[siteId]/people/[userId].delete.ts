import { and, eq } from 'drizzle-orm'

/** Remove someone from the site. Anyone can leave; the last owner can't. */
export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')!
    const userId = getRouterParam(event, 'userId')!
    const me = await requireUser(event)
    const leaving = me.id === userId
    const { site, role: actorRole } = await requireSiteAccess(event, siteId, leaving ? 'viewer' : 'admin')

    const db = useDb()
    const member = await db.query.siteMembers.findFirst({ where: and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)) })
    if (!member) throw createError({ statusCode: 404, statusMessage: 'That person isn’t on this site' })
    if (!leaving && !canManage(actorRole, member.role)) throw createError({ statusCode: 403, statusMessage: 'Your role can’t remove that person' })
    if (member.role === 'owner' && await ownerCount(site.id) <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'A site needs at least one owner. Make someone else an owner first.' })
    }
    await db.delete(schema.siteMembers).where(and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)))
    return leaving ? { left: true } : await loadPeople(site.id, actorRole)
})
