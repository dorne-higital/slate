import { eq } from 'drizzle-orm'
interface SignupBody {
    name?: string
    email?: string
    password?: string
    siteName?: string
    layout?: string
    /** Joining someone else's site from an invitation link: no new site is made */
    invite?: string
    /** Where they first came from, saved by the browser */
    source?: unknown
    /** Cloudflare Turnstile token */
    turnstile?: string
    /** Private sign-up link (signupLink.ts) while Slate is coming soon */
    key?: string
    /** Where the business is based (new sites only): Slate sells to the UK only for now */
    country?: string
}

/** Sign-up in one step: creates the account, signs it in, creates the site and its starter pages. */
export default defineEventHandler(async (event) => {
    const body = await readBody<SignupBody>(event)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''
    const siteName = body.siteName?.trim() ?? ''

    const joining = typeof body.invite === 'string' && body.invite.length > 0
    // Before launch only invited team members and holders of a private link can make accounts
    if (!joining && !await signupOpen(body.key)) throw createError({ statusCode: 403, statusMessage: 'Slate isn’t open for sign-ups yet. Leave your email on slatecms.co.uk and we’ll tell you when it opens.' })
    if (!name || !email || (!siteName && !joining)) throw createError({ statusCode: 400, statusMessage: 'Fill in every field' })
    if (!joining && !sellsTo(body.country)) throw createError({ statusCode: 400, statusMessage: NOT_SELLING_MESSAGE })
    if (password.length < 10) throw createError({ statusCode: 400, statusMessage: 'Your password needs at least 10 characters' })
    if (!await verifyTurnstile(body.turnstile, requestIp(event))) throw createError({ statusCode: 400, statusMessage: TURNSTILE_FAILED })
    const emailProblem = await checkEmailAddress(email)
    if (emailProblem) throw createError({ statusCode: 400, statusMessage: emailProblem })
    if (joining && !await findOpenInvite(body.invite!)) {
        throw createError({ statusCode: 410, statusMessage: 'This invitation has expired or has already been used. Ask for a new link.' })
    }

    const db = useDb()
    const slug = joining ? '' : await freeSlug(slugify(siteName) || 'site')

    let signedUp
    try {
        signedUp = await useAuth().api.signUpEmail({ body: { name, email, password, callbackURL: '/sites?verified=1' }, headers: event.headers, returnHeaders: true })
    } catch (err) {
        const message = (err as { body?: { message?: string } }).body?.message
        throw createError({ statusCode: 400, statusMessage: message ?? 'Couldn’t create your account' })
    }
    for (const cookie of signedUp.headers.getSetCookie()) appendResponseHeader(event, 'set-cookie', cookie)
    const userId = signedUp.response.user.id
    const source = cleanSource(body.source)
    if (source) await useDb().update(schema.user).set({ signupSource: source }).where(eq(schema.user.id, userId))

    if (joining) {
        const { siteId } = await acceptInvite(body.invite!, userId)
        return { siteId, slug: null }
    }

    await startTrial(userId)
    const siteId = await createSite({ name: siteName, slug, layout: body.layout, userId })
    return { siteId, slug }
})
