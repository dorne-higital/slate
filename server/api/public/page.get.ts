import { and, eq, inArray } from 'drizzle-orm'

/** The published version of one page on the site this request's Host belongs to. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

    const rawPath = String(getQuery(event).path ?? '/')
    const path = rawPath === '/' ? '/' : `/${rawPath.replace(/^\/+|\/+$/g, '')}`

    const offlinePage = site.offline
        ? await useDb().query.pages.findFirst({ where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, '/_offline'), eq(schema.pages.kind, 'system'), eq(schema.pages.status, 'published')) })
        : undefined
    const [found, shell] = await Promise.all([
        offlinePage ?? (isSystemPath(path) ? undefined : useDb().query.pages.findFirst({
            where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path), eq(schema.pages.status, 'published'))
        })),
        publicShell(site)
    ])
    // Nothing at this address: an old address the owner redirected…
    if (!found) {
        const redirect = await findRedirect(event, site.id, rawPath === '/' ? '/' : path)
        // Sent as a "not found" carrying where to go, so the page data keeps one shape
        if (redirect) throw createError({ statusCode: 404, statusMessage: 'Moved', data: { redirect } })
    }
    // …or else the site's own "Page not found" page, if it's published
    const page = found ?? await useDb().query.pages.findFirst({
        where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, '/_404'), eq(schema.pages.kind, 'system'), eq(schema.pages.status, 'published'))
    })
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    const notFound = !found
    const offline = !!offlinePage

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
        notFound: notFound && !offline,
        offline,
        posts,
        projects,
        forms: Object.fromEntries(formRows.map(f => [f.id, toFormDefinition(f)])) as Record<string, FormDefinition>,
        page: {
            title: page.title,
            path: page.path,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            shareImage: page.shareImage,
            noIndex: page.noIndex || notFound || offline,
            kind: page.kind,
            project: page.kind === 'project' ? { ...cleanProjectMeta({}), ...(page.project ?? {}) } : null,
            blocks
        }
    }
})
