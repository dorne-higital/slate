import { and, eq } from 'drizzle-orm'

/**
 * The owner wants to move a domain they bought through Slate to another registrar.
 * Gives the transfer code (or, for .uk names, how to move it). Platform admins are told.
 */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'owner')
    const id = getRouterParam(event, 'orderId')!
    if (!isUuid(id)) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    const order = await useDb().query.domainOrders.findFirst({ where: and(eq(schema.domainOrders.id, id), eq(schema.domainOrders.siteId, site.id)) })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    if (order.status !== 'active' && order.status !== 'cancelled') throw createError({ statusCode: 409, statusMessage: 'This domain isn’t set up yet, so it can’t be moved. Ask us through Support.' })
    if (order.simulated) return { kind: 'test' as const }
    if (isUkDomain(order.domainName)) {
        await alertPlatformAdmins(`Transfer asked for: ${order.domainName}`, `${user.name} (${user.email}) wants to move ${order.domainName} away from Slate. It's a .uk name, so they'll send the new registrar's IPS tag through Support. Change the tag at name.com when it arrives.`)
        return { kind: 'uk' as const }
    }
    let code: string
    try {
        code = await transferCode(order.domainName)
    } catch {
        throw createError({ statusCode: 502, statusMessage: 'Couldn’t get the code just now. Please try again in a few minutes, or ask us through Support.' })
    }
    await alertPlatformAdmins(`Transfer code given out: ${order.domainName}`, `${user.name} (${user.email}) got the transfer code for ${order.domainName} from the Domains page. The domain is now unlocked at name.com.`)
    return { kind: 'code' as const, code }
})
