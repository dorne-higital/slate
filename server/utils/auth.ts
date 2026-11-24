import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError, createAuthMiddleware } from 'better-auth/api'
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
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 10,
            resetPasswordTokenExpiresIn: 3600,
            revokeSessionsOnPasswordReset: true,
            sendResetPassword: async ({ user, url }) => {
                await sendPasswordResetEmail(user.email, user.name, url)
            }
        },
        // Every new account gets a "confirm your email" link. They can use Slate straight away,
        // but emailing invites and buying domains wait until it's confirmed.
        emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            expiresIn: 3 * 24 * 3600,
            sendVerificationEmail: async ({ user, url }) => {
                await sendVerifyEmail(user.email, user.name, url)
            }
        },
        // Bot check on the endpoints people can hammer (sign-up has its own, in /api/signup)
        hooks: {
            before: createAuthMiddleware(async (ctx) => {
                if (ctx.path !== '/sign-in/email' && ctx.path !== '/request-password-reset' && ctx.path !== '/send-verification-email') return
                // Calls made by our own server code (no incoming request) aren't from a browser
                if (!ctx.request) return
                const token = ctx.headers?.get('x-turnstile-token')
                const ip = ctx.headers?.get('cf-connecting-ip')
                if (!await verifyTurnstile(token, ip)) throw new APIError('BAD_REQUEST', { message: TURNSTILE_FAILED })
            })
        },
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
    // Remembered for the error log, so an error can say who hit it
    event.context.user = { id: user.id }
    return user
}

/** Some things (emailing invites, buying domains) wait until the account's email is confirmed. */
export function requireVerifiedEmail(user: { emailVerified?: boolean | null, isPlatformAdmin?: boolean | null }) {
    if (!user.emailVerified && !user.isPlatformAdmin) {
        throw createError({ statusCode: 403, statusMessage: 'Please confirm your email address first. We sent you a link when you signed up; you can send it again from the banner at the top.' })
    }
}
