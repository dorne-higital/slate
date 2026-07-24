import { requirePlatformAdmin } from '../../utils/requireSiteAccess'

interface CreateSiteBody {
    name: string
    slug: string
    ownerUserId: string
}

/**
 * Creates a site and its owner membership row in one request. Platform-
 * admin only (see the "SECOND LOOK" note on the sites_insert RLS policy in
 * the migration) — site owners cannot self-serve new sites in this pass.
 */
export default defineEventHandler(async (event) => {
    const { client } = await requirePlatformAdmin(event)
    const body = await readBody<CreateSiteBody>(event)

    if (!body?.name?.trim() || !body?.slug?.trim() || !body?.ownerUserId) {
        throw createError({ statusCode: 400, statusMessage: 'name, slug and ownerUserId are required' })
    }

    const { data: site, error: siteError } = await client
        .from('sites')
        .insert({ name: body.name.trim(), slug: body.slug.trim() })
        .select()
        .single()

    if (siteError) {
        throw createError({ statusCode: 400, statusMessage: siteError.message })
    }

    const { error: memberError } = await client
        .from('site_members')
        .insert({ site_id: site.id, user_id: body.ownerUserId, role: 'owner' })

    if (memberError) {
        // Site row is already committed — surface the failure rather than
        // silently leaving an ownerless site. The caller can retry adding
        // the owner via the site_members endpoint.
        throw createError({
            statusCode: 400,
            statusMessage: `Site created, but assigning the owner failed: ${memberError.message}`
        })
    }

    return { site }
})
