import { and, eq } from 'drizzle-orm'

/** The published version of one page on the site this request's Host belongs to. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })

    const rawPath = String(getQuery(event).path ?? '/')
    const path = rawPath === '/' ? '/' : `/${rawPath.replace(/^\/+|\/+$/g, '')}`

    const [page, menus] = await Promise.all([
        useDb().query.pages.findFirst({
            where: and(eq(schema.pages.siteId, site.id), eq(schema.pages.path, path), eq(schema.pages.status, 'published'))
        }),
        loadMenus(site.id)
    ])
    if (!page) throw createError({ statusCode: 404, statusMessage: 'Page not found' })

    setResponseHeader(event, 'cache-control', 'public, max-age=30, stale-while-revalidate=300')
    return {
        site: { name: site.name, theme: site.theme ?? {} },
        menus: { header: menus.header, footer: menus.footer, legal: menus.legal },
        page: {
            title: page.title,
            path: page.path,
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            blocks: page.publishedBlocks ?? []
        }
    }
})
