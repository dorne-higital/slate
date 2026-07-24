import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { Block, PageStatus } from '../../../types'
import type { Database } from '../../../types/database.types'

interface UpdatePageBody {
    siteId: string
    title?: string
    slug?: string
    parentId?: string | null
    status?: PageStatus
    seoTitle?: string | null
    seoDescription?: string | null
    blocks?: Block[]
}

type PageUpdate = Database['public']['Tables']['pages']['Update']

export default defineEventHandler(async (event) => {
    const pageId = getRouterParam(event, 'pageId')
    const body = await readBody<UpdatePageBody>(event)

    if (!pageId || !body?.siteId) {
        throw createError({ statusCode: 400, statusMessage: 'pageId and siteId are required' })
    }

    // Empty slug means "home page" (see server/api/public/site-page.get.ts)
    // — only valid for a top-level page. This only catches the case where
    // both are changed together; the create route is the primary guard.
    if (body.slug !== undefined && body.slug.trim() === '' && body.parentId) {
        throw createError({ statusCode: 400, statusMessage: 'Only a top-level page can have a blank slug' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    const update: PageUpdate = {}

    if (body.title !== undefined) update.title = body.title.trim()
    if (body.slug !== undefined) update.slug = body.slug.trim()
    if (body.parentId !== undefined) update.parent_id = body.parentId
    if (body.status !== undefined) update.status = body.status
    if (body.seoTitle !== undefined) update.seo_title = body.seoTitle
    if (body.seoDescription !== undefined) update.seo_description = body.seoDescription
    if (body.blocks !== undefined) update.blocks = body.blocks

    const { data, error } = await client
        .from('pages')
        .update(update)
        .eq('id', pageId)
        .eq('site_id', body.siteId)
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { page: data }
})
