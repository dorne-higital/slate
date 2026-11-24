import { and, eq, max } from 'drizzle-orm'

/** Creates a draft page, optionally underneath another one (/services → /services/sofas). */
export default defineEventHandler(async (event) => {
    const { site, user } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!, 'editor')
    const pageCount = (await useDb().select({ id: schema.pages.id }).from(schema.pages).where(eq(schema.pages.siteId, site.id))).length
    await requireWithinPlan(site, l => pageCount < l.pagesPerSite, `Your plan includes up to ${findPlan('starter')!.limits.pagesPerSite} pages.`)
    const body = await readBody<{ title?: string, parentId?: string | null }>(event)
    const title = String(body.title ?? '').trim().slice(0, 120)
    if (!title) throw createError({ statusCode: 400, statusMessage: 'Give the page a title' })

    const db = useDb()
    let parentPath = ''
    let parentId: string | null = null
    if (body.parentId) {
        if (!isUuid(body.parentId)) throw createError({ statusCode: 400, statusMessage: 'That parent page doesn’t exist' })
        const parent = await db.query.pages.findFirst({ where: and(eq(schema.pages.id, body.parentId), eq(schema.pages.siteId, site.id)) })
        if (!parent) throw createError({ statusCode: 400, statusMessage: 'That parent page doesn’t exist' })
        parentId = parent.id
        parentPath = parent.path === '/' ? '' : parent.path
    }

    let base = `${parentPath}/${slugify(title) || 'page'}`
    // The blog lives at /blog, so a page can't
    if (base === BLOG_PATH || base.startsWith(`${BLOG_PATH}/`)) base = base.replace(BLOG_PATH, `${BLOG_PATH}-page`)
    let path = base
    for (let n = 2; await db.query.pages.findFirst({ where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path)), columns: { id: true } }); n++) {
        path = `${base}-${n}`
    }

    const [{ last } = { last: 0 }] = await db.select({ last: max(schema.pages.position) }).from(schema.pages).where(eq(schema.pages.siteId, site.id))
    const blocks = [newBlock('hero')]
    ;(blocks[0]!.props as Record<string, unknown>).heading = title

    const [page] = await db.insert(schema.pages).values({
        siteId: site.id, parentId, title, path, position: (last ?? 0) + 1, status: 'draft', blocks, updatedBy: user.id
    }).returning()
    return toEditorPage(page!)
})
