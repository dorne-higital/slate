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

    // Every site starts with a contact form, placed on its contact-style pages
    const contactPages = ['contact', 'get a quote', 'book', 'join', 'visit us']
    const [contactForm] = await db.insert(schema.forms).values({
        siteId,
        ...cleanFormInput({ name: layout.pages.find(p => contactPages.includes(p.toLowerCase())) ?? 'Contact', fields: defaultContactFields() })
    }).returning({ id: schema.forms.id })

    await db.batch([
        db.insert(schema.siteMembers).values({ siteId, userId, role: 'owner' }),
        db.insert(schema.pages).values(layout.pages.map((title, i) => {
            const path = i === 0 ? '/' : `/${slugify(title)}`
            const blocks: Block[] = [{
                id: crypto.randomUUID(),
                type: 'hero',
                props: { heading: i === 0 ? layout.hero : title, text: '', buttonLabel: i === 0 ? 'Get in touch' : '', buttonUrl: '' }
            }]
            if (contactPages.includes(title.toLowerCase())) {
                blocks.push({ id: crypto.randomUUID(), type: 'form', props: { heading: 'Send us a message', intro: 'We’ll get back to you within a working day.', formId: contactForm!.id } })
            }
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
