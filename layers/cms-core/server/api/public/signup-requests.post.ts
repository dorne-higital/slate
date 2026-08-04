import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '../../../types/database.types'

interface SignupRequestBody {
    firstName: string
    lastName: string
    email: string
    phone?: string
    siteName: string
    plan: 'free' | 'pro' | 'business'
}

const PLANS = new Set(['free', 'pro', 'business'])

/**
 * Unauthenticated by design — the /register page has no session to
 * attach this to. Relies on signup_requests_insert's WITH CHECK (status
 * must be 'new', converted_site_id must be null) rather than an app-layer
 * gate to keep an anonymous caller from fabricating anything beyond a
 * brand-new, unconverted request. A platform admin reviews and converts
 * these from /admin — see server/api/admin/signup-requests/.
 */
export default defineEventHandler(async (event) => {
    const body = await readBody<SignupRequestBody>(event)

    if (!body?.firstName?.trim() || !body?.lastName?.trim() || !body?.email?.trim() || !body?.siteName?.trim()) {
        throw createError({ statusCode: 400, statusMessage: 'firstName, lastName, email and siteName are required' })
    }

    if (!PLANS.has(body.plan)) {
        throw createError({ statusCode: 400, statusMessage: 'plan must be one of free, pro, business' })
    }

    const client = await serverSupabaseClient<Database>(event)

    const { data, error } = await client
        .from('signup_requests')
        .insert({
            first_name: body.firstName.trim(),
            last_name: body.lastName.trim(),
            email: body.email.trim(),
            phone: body.phone?.trim() || null,
            site_name: body.siteName.trim(),
            plan: body.plan
        })
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { signupRequest: data }
})
