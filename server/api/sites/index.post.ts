/** A signed-in person starts another site. It's billed to them, so their plan's site limit applies. */
export default defineEventHandler(async (event) => {
    const user = await requireUser(event)
    const { name, layout } = await readBody<{ name?: string, layout?: string }>(event)
    const siteName = String(name ?? '').trim().slice(0, 80)
    if (!siteName) throw createError({ statusCode: 400, statusMessage: 'Give your site a name' })

    if (!user.isPlatformAdmin) {
        await startTrial(user.id)
        const { account } = await loadPayer(user.id)
        const status = accountStatus(account, false)
        const limits = limitsFor(status, findPlan(account?.plan)?.key ?? null)
        if (status === 'expired') throw createError({ statusCode: 402, statusMessage: 'Choose a plan in Billing to start another site.' })
        if (await billedSiteCount(user.id) >= limits.sites) {
            throw createError({ statusCode: 402, statusMessage: limits.sites === 1 ? 'Your plan includes one site. The Studio plan gives you up to 10.' : `Your plan includes up to ${limits.sites} sites.` })
        }
    }
    const siteId = await createSite({ name: siteName, slug: await freeSlug(slugify(siteName) || 'site'), layout, userId: user.id })
    return { siteId }
})
