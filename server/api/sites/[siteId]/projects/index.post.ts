import { and, eq, max } from 'drizzle-orm'

/** A new draft project at /work/{slug}, with a starter case-study layout. */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const { title: rawTitle } = await readBody<{ title?: string }>(event)
    const title = String(rawTitle ?? '').trim().slice(0, 120)
    if (!title) throw createError({ statusCode: 400, statusMessage: 'Give the project a name' })
    const pageCount = (await useDb().select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.siteId, site.id))).length
    await requireWithinPlan(site, l => pageCount < l.pagesPerSite, 'Your plan’s page limit includes projects.')

    const db = useDb()
    const base = `${PROJECTS_PATH}/${slugify(title) || 'project'}`
    let path = base
    for (let n = 2; await db.query.pages.findFirst({ where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path)), columns: { id: true } }); n++) path = `${base}-${n}`

    const block = (type: string, props: Record<string, unknown> = {}) => ({ ...newBlock(type), props: { ...newBlock(type).props, ...props } })
    const blocks = cleanBlocks([
        block('text', { eyebrow: 'The brief', heading: 'What they needed', body: 'Describe the project: who it was for and what they wanted.' }),
        block('gallery', { heading: 'Screens', columns: '3', shape: 'natural' }),
        block('reviews', { heading: '', layout: 'feature', items: [{ quote: 'What the client said about working with you.', name: 'Client name', role: 'Their business', photo: '' }], sectionBg: 'dark' }),
        block('cta', { eyebrow: 'Need a hand?', heading: 'Let’s build something good', buttonLabel: 'Say hello', buttonUrl: '/contact', style: 'plain' })
    ])
    const [{ last } = { last: 0 }] = await db.select({ last: max(schema.pages.position) }).from(schema.pages).where(eq(schema.pages.siteId, site.id))
    const [row] = await db.insert(schema.pages).values({
        siteId: site.id, title, path, kind: 'project', project: cleanProjectMeta({ year: String(new Date().getFullYear()) }),
        position: (last ?? 0) + 1, status: 'draft', blocks, updatedBy: user.id
    }).returning()
    return toEditorProject(row!)
})
