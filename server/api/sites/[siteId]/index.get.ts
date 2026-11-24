export default defineEventHandler(async (event) => {
    const { site, role } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const config = useRuntimeConfig()
    return {
        id: site.id,
        name: site.name,
        slug: site.slug,
        customDomain: site.customDomain,
        theme: site.theme ?? {},
        freeAddress: `${site.slug}.${config.public.sitesDomain}`,
        role
    }
})
