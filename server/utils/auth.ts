import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import type { H3Event } from 'h3'

let cached: ReturnType<typeof create> | undefined

function create() {
    const config = useRuntimeConfig()
    const appHost = config.public.appHost
    const protocol = appHost.startsWith('localhost') ? 'http' : 'https'
    return betterAuth({
        secret: config.betterAuthSecret,
        baseURL: `${protocol}://${appHost}`,
        database: drizzleAdapter(useDb(), {
            provider: 'pg',
            schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification }
        }),
        emailAndPassword: { enabled: true, minPasswordLength: 10 },
        user: {
            additionalFields: {
                // input: false → can never be set through sign-up or profile updates
                isPlatformAdmin: { type: 'boolean', defaultValue: false, input: false }
            }
        }
    })
}

export function useAuth() {
    if (!cached) cached = create()
    return cached
}

export async function getSessionUser(event: H3Event) {
    const session = await useAuth().api.getSession({ headers: event.headers })
    return session?.user ?? null
}

export async function requireUser(event: H3Event) {
    const user = await getSessionUser(event)
    if (!user) throw createError({ statusCode: 401, statusMessage: 'Please log in' })
    return user
}
