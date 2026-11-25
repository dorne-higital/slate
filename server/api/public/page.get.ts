import { and, eq, inArray } from 'drizzle-orm'

/** The published version of one page on the site this request's Host belongs to. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

    const rawPath = String(getQuery(event).path ?? '/')
    const path = rawPath === '/' ? '/' : `/${rawPath.replace(/^\/+|\/+$/g, '')}`

    const [page, shell] = await Promise.all([
        useDb().query.pages.findFirst({
            where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path), eq(schema.pages.status, 'published'))
        }),
        publicShell(site)
    ])
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    // The forms this page's Form blocks use
    const blocks = page.publishedBlocks ?? []
    const formIds = [...new Set(blocks.filter(b => b.type === 'form').map(b => String(b.props.formId ?? '')).filter(isUuid))]
    const formRows = formIds.length
        ? await useDb().select().from(schema.forms).where(and(eq(schema.forms.siteId, site.id), inArray(schema.forms.id, formIds)))
        : []

    // Latest posts blocks need the newest posts
    const postsWanted = Math.max(0, ...blocks.filter(b => b.type === 'latestPosts').map(b => Math.min(12, Number.parseInt(String(b.props.count ?? '3')) || 3)))
    const posts = postsWanted ? await livePosts(site.id, { limit: postsWanted }) : []
    // Projects blocks need the project cards
    const projects = blocks.some(b => b.type === 'projects') ? await liveProjectCards(site.id) : []

    setResponseHeader(event, 'cache-control', 'public, max-age=30, stale-while-revalidate=300')
    return {
        ...shell,
        posts,
        projects,
        forms: Object.fromEntries(formRows.map(f => [f.id, toFormDefinition(f)])) as Record<string, FormDefinition>,
        page: {
            title: page.title,
            path: page.path,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            shareImage: page.shareImage,
            noIndex: page.noIndex,
            kind: page.kind,
            project: page.kind === 'project' ? { ...cleanProjectMeta({}), ...(page.project ?? {}) } : null,
            blocks
        }
    }
})
