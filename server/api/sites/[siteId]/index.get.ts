export default defineEventHandler(async (event) => {
    const { site, role, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const config = useRuntimeConfig()
    return {
        id: site.id,
        name: site.name,
        slug: site.slug,
        customDomain: site.customDomain,
        theme: site.theme ?? {},
        replyEmail: site.replyEmail,
        integrations: site.integrations ?? {},
        offline: site.offline,
        freeAddress: `${site.slug}.${config.public.sitesDomain}`,
        // Where visitors actually find the site right now
        liveAddress: await liveAddress(site),
        role,
        billing: await siteBilling(site, user.id)
    }
})
