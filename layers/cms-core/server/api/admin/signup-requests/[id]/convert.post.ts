import { requirePlatformAdmin } from '../../../../utils/requireSiteAccess'
import { isReservedSiteSlug } from '../../../../../utils/reservedSiteSlugs'
import { slugifySiteName } from '../../../../utils/slugifySiteName'
import { supabaseServiceRoleClient } from '../../../../utils/supabaseServiceRole'

/**
 * Turns a signup_requests row into a real site: creates the site, gets
 * the requester their own login (inviting a brand-new email via Supabase
 * Auth's admin API, or reusing their existing account if that email is
 * already registered), makes them that site's owner, and marks the
 * request converted. Not wrapped in a database transaction — PostgREST
 * doesn't offer one across these calls — so a failure partway through can
 * leave a site created without an owner; error messages below say
 * exactly which step failed so the admin can finish it by hand via the
 * existing "New site" / site_members flows, same risk this app already
 * accepts in server/api/sites/index.post.ts.
 */
export default defineEventHandler(async (event) => {
    const { client } = await requirePlatformAdmin(event)
    const id = getRouterParam(event, 'id')

    if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'id is required' })
    }

    const { data: signupRequest, error: fetchError } = await client
        .from('signup_requests')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !signupRequest) {
        throw createError({ statusCode: 404, statusMessage: 'Signup request not found' })
    }

    if (signupRequest.status === 'converted') {
        throw createError({ statusCode: 400, statusMessage: 'This signup request was already converted' })
    }

    const slug = slugifySiteName(signupRequest.site_name)

    if (!slug) {
        throw createError({ statusCode: 400, statusMessage: 'Could not derive a valid slug from the site name' })
    }

    if (isReservedSiteSlug(slug)) {
        throw createError({ statusCode: 400, statusMessage: `"${slug}" is a reserved slug — rename the site before converting` })
    }

    const { data: site, error: siteError } = await client
        .from('sites')
        .insert({ name: signupRequest.site_name, slug })
        .select()
        .single()

    if (siteError) {
        throw createError({ statusCode: 400, statusMessage: `Could not create the site: ${siteError.message}` })
    }

    // Reuse the existing account if this email is already registered —
    // inviteUserByEmail() is for brand-new users only, and re-inviting an
    // existing one would just error.
    const { data: existingProfile } = await client
        .from('profiles')
        .select('id')
        .eq('email', signupRequest.email)
        .maybeSingle()

    let userId = existingProfile?.id

    if (!userId) {
        const serviceClient = supabaseServiceRoleClient(event)
        const redirectTo = `${getRequestURL(event).origin}/confirm`

        const { data: invite, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(signupRequest.email, {
            data: { first_name: signupRequest.first_name, last_name: signupRequest.last_name },
            redirectTo
        })

        if (inviteError || !invite.user) {
            throw createError({
                statusCode: 400,
                statusMessage: `Site "${site.name}" was created, but inviting ${signupRequest.email} failed: ${inviteError?.message ?? 'unknown error'}. Add them as owner manually from the site's Settings.`
            })
        }

        userId = invite.user.id
    }

    const { error: memberError } = await client
        .from('site_members')
        .insert({ site_id: site.id, user_id: userId, role: 'owner' })

    if (memberError) {
        throw createError({
            statusCode: 400,
            statusMessage: `Site "${site.name}" was created and ${signupRequest.email} was invited, but adding them as owner failed: ${memberError.message}. Add them from the site's Settings.`
        })
    }

    const { error: updateError } = await client
        .from('signup_requests')
        .update({ status: 'converted', converted_site_id: site.id })
        .eq('id', id)

    if (updateError) {
        throw createError({
            statusCode: 400,
            statusMessage: `Site "${site.name}" was created and ${signupRequest.email} was added as owner, but marking the request converted failed: ${updateError.message}`
        })
    }

    return { site }
})
