interface SignupBody {
    name?: string
    email?: string
    password?: string
    siteName?: string
    layout?: string
    /** Joining someone else's site from an invitation link: no new site is made */
    invite?: string
}

/** Sign-up in one step: creates the account, signs it in, creates the site and its starter pages. */
export default defineEventHandler(async (event) => {
    const body = await readBody<SignupBody>(event)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''
    const siteName = body.siteName?.trim() ?? ''

    const joining = typeof body.invite === 'string' && body.invite.length > 0
    if (!name || !email || (!siteName && !joining)) throw createError({ statusCode: 400, statusMessage: 'Fill in every field' })
    if (password.length < 10) throw createError({ statusCode: 400, statusMessage: 'Your password needs at least 10 characters' })
    if (joining && !await findOpenInvite(body.invite!)) {
        throw createError({ statusCode: 410, statusMessage: 'This invitation has expired or has already been used. Ask for a new link.' })
    }

    const db = useDb()
    const slug = joining ? '' : await freeSlug(slugify(siteName) || 'site')

    let signedUp
    try {
        signedUp = await useAuth().api.signUpEmail({ body: { name, email, password }, headers: event.headers, returnHeaders: true })
    } catch (err) {
        const message = (err as { body?: { message?: string } }).body?.message
        throw createError({ statusCode: 400, statusMessage: message ?? 'Couldn’t create your account' })
    }
    for (const cookie of signedUp.headers.getSetCookie()) appendResponseHeader(event, 'set-cookie', cookie)
    const userId = signedUp.response.user.id

    if (joining) {
        const { siteId } = await acceptInvite(body.invite!, userId)
        return { siteId, slug: null }
    }

    await startTrial(userId)
    const siteId = await createSite({ name: siteName, slug, layout: body.layout, userId })
    return { siteId, slug }
})
