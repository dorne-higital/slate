import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm'
import type { H3Event } from 'h3'

/** The People list: members plus invites nobody has used yet. Admins and owners only. */
export async function loadPeople(siteId: string, actorRole: SiteRole) {
    const db = useDb()
    const [members, pending] = await Promise.all([
        db.select({ userId: schema.user.id, name: schema.user.name, email: schema.user.email, role: schema.siteMembers.role, joinedAt: schema.siteMembers.createdAt })
            .from(schema.siteMembers)
            .innerJoin(schema.user, eq(schema.user.id, schema.siteMembers.userId))
            .where(eq(schema.siteMembers.siteId, siteId))
            .orderBy(asc(schema.siteMembers.createdAt)),
        db.select().from(schema.invites)
            .where(and(eq(schema.invites.siteId, siteId), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())))
            .orderBy(desc(schema.invites.createdAt))
    ])
    return {
        yourRole: actorRole,
        canInvite: assignableRoles(actorRole),
        members: members.map(m => ({ ...m, joinedAt: m.joinedAt.toISOString(), canManage: canManage(actorRole, m.role) })),
        invites: pending.map(i => ({ id: i.id, role: i.role, label: i.label, expiresAt: i.expiresAt.toISOString(), canManage: canManage(actorRole, i.role) }))
    }
}

/** The site's owners. Used to stop the last one being removed or demoted. */
export async function ownerCount(siteId: string) {
    const rows = await useDb().select({ id: schema.siteMembers.userId }).from(schema.siteMembers)
        .where(and(eq(schema.siteMembers.siteId, siteId), eq(schema.siteMembers.role, 'owner')))
    return rows.length
}

/** A long random token for invitation links. */
export function inviteToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(24))
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function inviteUrl(event: H3Event, token: string) {
    const { appHost } = useRuntimeConfig().public
    const protocol = appHost.startsWith('localhost') ? 'http' : 'https'
    return `${protocol}://${appHost}/invite/${token}`
}
