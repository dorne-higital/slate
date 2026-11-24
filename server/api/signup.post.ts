import { eq } from 'drizzle-orm'

interface SignupBody {
    name?: string
    email?: string
    password?: string
    siteName?: string
    layout?: string
}

/** Sign-up in one step: creates the account, signs it in, creates the site and its starter pages. */
export default defineEventHandler(async (event) => {
    const body = await readBody<SignupBody>(event)
    const name = body.name?.trim() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''
    const siteName = body.siteName?.trim() ?? ''

    if (!name || !email || !siteName) throw createError({ statusCode: 400, statusMessage: 'Fill in every field' })
    if (password.length < 10) throw createError({ statusCode: 400, statusMessage: 'Your password needs at least 10 characters' })

    const db = useDb()
    const slug = await freeSlug(slugify(siteName) || 'site')

    let signedUp
    try {
        signedUp = await useAuth().api.signUpEmail({ body: { name, email, password }, headers: event.headers, returnHeaders: true })
    } catch (err) {
        const message = (err as { body?: { message?: string } }).body?.message
        throw createError({ statusCode: 400, statusMessage: message ?? 'Couldn’t create your account' })
    }
    for (const cookie of signedUp.headers.getSetCookie()) appendResponseHeader(event, 'set-cookie', cookie)
    const userId = signedUp.response.user.id

    const layout = findStarterLayout(body.layout ?? 'trade')
    const [site] = await db.insert(schema.sites).values({ name: siteName, slug }).returning({ id: schema.sites.id })
    const siteId = site!.id

    await db.batch([
        db.insert(schema.siteMembers).values({ siteId, userId, role: 'owner' }),
        db.insert(schema.pages).values(layout.pages.map((title, i) => {
            const path = i === 0 ? '/' : `/${slugify(title)}`
            const blocks: Block[] = [{
                id: crypto.randomUUID(),
                type: 'hero',
                props: { heading: i === 0 ? layout.hero : title, text: '', buttonLabel: i === 0 ? 'Get in touch' : '', buttonUrl: '' }
            }]
            return { siteId, title, path, position: i, status: 'published' as const, blocks, publishedBlocks: blocks, publishedAt: new Date(), updatedBy: userId }
        }))
    ])

    return { siteId, slug }
})

async function freeSlug(base: string) {
    const db = useDb()
    const root = RESERVED_SLUGS.has(base) ? `${base}-site` : base
    for (let n = 1; n < 50; n++) {
        const candidate = n === 1 ? root : `${root}-${n}`
        const taken = await db.query.sites.findFirst({ where: eq(schema.sites.slug, candidate), columns: { id: true } })
        if (!taken) return candidate
    }
    return `${root}-${crypto.randomUUID().slice(0, 6)}`
}
