import { requireSiteAccess } from '../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')

    if (!siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const { data: site, error } = await client
        .from('sites')
        .select('id, name, slug, status, custom_domain, created_at, updated_at, site_members(user_id, role, profiles(email, full_name))')
        .eq('id', siteId)
        .single()

    if (error) {
        throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    }

    return { site }
})
