import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { Database } from '../../../types/database.types'

interface UpdateSiteBody {
    name?: string
    slug?: string
    customDomain?: string | null
}

type SiteUpdate = Database['public']['Tables']['sites']['Update']

export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')

    if (!siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const body = await readBody<UpdateSiteBody>(event)
    const { client } = await requireSiteAccess(event, siteId, 'admin')

    const update: SiteUpdate = {}

    if (body.name !== undefined) update.name = body.name.trim()
    if (body.slug !== undefined) update.slug = body.slug.trim()
    if (body.customDomain !== undefined) {
        update.custom_domain = body.customDomain ? body.customDomain.trim().toLowerCase() : null
    }

    const { data, error } = await client
        .from('sites')
        .update(update)
        .eq('id', siteId)
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { site: data }
})
