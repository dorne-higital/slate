import { and, eq } from 'drizzle-orm'

/** Change someone's role. Owners can change anyone; admins only editors and viewers. */
export default defineEventHandler(async (event) => {
    const { site, role: actorRole } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'admin')
    const userId = getRouterParam(event, 'userId')!
    const { role } = await readBody<{ role?: SiteRole }>(event)
    if (!role || !(role in ROLE_RANK)) throw createError({ statusCode: 400, statusMessage: 'Pick a role' })

    const db = useDb()
    const member = await db.query.siteMembers.findFirst({ where: and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)) })
    if (!member) throw createError({ statusCode: 404, statusMessage: 'That person isn’t on this site' })
    if (!canManage(actorRole, member.role) || !assignableRoles(actorRole).includes(role)) {
        throw createError({ statusCode: 403, statusMessage: 'Your role can’t make that change' })
    }
    if (member.role === 'owner' && role !== 'owner' && await ownerCount(site.id) <= 1) {
        throw createError({ statusCode: 400, statusMessage: 'A site needs at least one owner. Make someone else an owner first.' })
    }
    await db.update(schema.siteMembers).set({ role }).where(and(eq(schema.siteMembers.siteId, site.id), eq(schema.siteMembers.userId, userId)))
    return await loadPeople(site.id, actorRole)
})
