import { requireSiteAccess } from '../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const siteId = String(query.siteId ?? '')

    const { client } = await requireSiteAccess(event, siteId, 'viewer')

    const [
        { count: pages, error: pagesError },
        { count: publishedPages, error: publishedError },
        { count: draftPages, error: draftError },
        { count: members, error: membersError },
        { data: activity, error: activityError }
    ] = await Promise.all([
        client.from('pages').select('id', { count: 'exact', head: true }).eq('site_id', siteId),
        client.from('pages').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'published'),
        client.from('pages').select('id', { count: 'exact', head: true }).eq('site_id', siteId).eq('status', 'draft'),
        client.from('site_members').select('user_id', { count: 'exact', head: true }).eq('site_id', siteId),
        client
            .from('audit_log')
            .select('id, site_id, actor_id, actor_email, action, entity_type, entity_id, entity_label, created_at')
            .eq('site_id', siteId)
            .order('created_at', { ascending: false })
            .limit(20)
    ])

    const firstError = pagesError || publishedError || draftError || membersError || activityError

    if (firstError) {
        throw createError({ statusCode: 500, statusMessage: firstError.message })
    }

    return {
        stats: {
            pages: pages ?? 0,
            publishedPages: publishedPages ?? 0,
            draftPages: draftPages ?? 0,
            members: members ?? 0
        },
        activity: activity ?? []
    }
})
