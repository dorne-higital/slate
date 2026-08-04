import { requirePlatformAdmin } from '../../../utils/requireSiteAccess'

export default defineEventHandler(async (event) => {
    const { client } = await requirePlatformAdmin(event)

    const { data, error } = await client
        .from('signup_requests')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        throw createError({ statusCode: 500, statusMessage: error.message })
    }

    return { signupRequests: data }
})
