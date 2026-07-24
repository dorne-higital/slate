import { requireSiteAccess } from '../../utils/requireSiteAccess'

interface DuplicatePageBody {
    siteId: string
    pageId: string
}

export default defineEventHandler(async (event) => {
    const body = await readBody<DuplicatePageBody>(event)

    if (!body?.siteId || !body?.pageId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId and pageId are required' })
    }

    const { client } = await requireSiteAccess(event, body.siteId, 'editor')

    const { data: original, error: fetchError } = await client
        .from('pages')
        .select('site_id, parent_id, title, slug, seo_title, seo_description, blocks')
        .eq('id', body.pageId)
        .eq('site_id', body.siteId)
        .single()

    if (fetchError) {
        throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }

    // Only the page itself is duplicated, not its children — cloning a
    // whole subtree silently would be surprising, not a convenience.
    const { data: copy, error: insertError } = await client
        .from('pages')
        .insert({
            site_id: original.site_id,
            parent_id: original.parent_id,
            title: `${original.title} (Copy)`,
            slug: `${original.slug}-copy-${Date.now().toString(36)}`,
            status: 'draft',
            seo_title: original.seo_title,
            seo_description: original.seo_description,
            blocks: original.blocks
        })
        .select()
        .single()

    if (insertError) {
        throw createError({ statusCode: 400, statusMessage: insertError.message })
    }

    return { page: copy }
})
