import { requireSiteAccess } from '../../utils/requireSiteAccess'

interface CreatePageBody {
    siteId: string
    title: string
    slug: string
    parentId?: string | null
}

export default defineEventHandler(async (event) => {
    const body = await readBody<CreatePageBody>(event)

    if (!body?.siteId || !body?.title?.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'siteId and title are required' })
    }

    const parentId = body.parentId ?? null
    const slug = normalizePageSlug(body.slug ?? '')

    // Empty slug means "home page" (see server/api/public/site-page.get.ts),
    // which only makes sense for a top-level page — the DB's unique
    // (site_id, parent_id, slug) constraint stops a second one existing.
    if (!slug && parentId) {
        throw createError({ statusCode: 400, statusMessage: 'Only a top-level page can have a blank slug' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    const { data, error } = await client
        .from('pages')
        .insert({
            site_id: body.siteId,
            parent_id: parentId,
            title: body.title.trim(),
            slug,
            status: 'draft',
            blocks: []
        })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { page: data }
})
