import { eq } from 'drizzle-orm'

/** Sets a special price for whoever pays for this site. */
export default defineEventHandler(async (event) => {
    requirePlatformAdmin(await requireUser(event))
    const site = await useDb().query.sites.findFirst({ where: eq(schema.sites.id, String(getRouterParam(event, 'siteId'))) })
    if (!site || site.deletedAt) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const b = await readBody<{ plan?: string, interval?: string, amount?: number }>(event)
    const plan = findPlan(b.plan)?.key as PlanKey | undefined
    const amount = Math.round(Number(b.amount))
    if (!plan || (b.interval !== 'month' && b.interval !== 'year')) throw createError({ statusCode: 400, statusMessage: 'Pick a plan and how often they pay' })
    if (!Number.isFinite(amount) || amount < 100 || amount > 1_000_000) throw createError({ statusCode: 400, statusMessage: 'Enter a price between £1 and £10,000' })
    const user = await setSpecialPrice(site, plan, b.interval, amount)
    return { ok: true, billTo: user.email }
})
