import { eq } from 'drizzle-orm'

/** Makes a site with its starter pages and a contact form, owned and paid for by `userId`. */
export async function createSite({ name: siteName, slug, layout: layoutKey, userId }: { name: string, slug: string, layout?: string, userId: string }) {
    const db = useDb()
    const layout = findStarterLayout(layoutKey ?? 'trade')
    const [site] = await db.insert(schema.sites).values({ name: siteName, slug, billingUserId: userId }).returning({ id: schema.sites.id })
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

    return siteId
}

export async function freeSlug(base: string) {
    const db = useDb()
    const root = RESERVED_SLUGS.has(base) ? `${base}-site` : base
    for (let n = 1; n < 50; n++) {
        const candidate = n === 1 ? root : `${root}-${n}`
        const taken = await db.query.sites.findFirst({ where: eq(schema.sites.slug, candidate), columns: { id: true } })
        if (!taken) return candidate
    }
    return `${root}-${crypto.randomUUID().slice(0, 6)}`
}
