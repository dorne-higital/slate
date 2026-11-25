import { asc, eq } from 'drizzle-orm'

/** Everything the Search and sharing page needs: every page's search details and the site defaults. */
export default defineEventHandler(async (event) => {
    const { site } = await requireSiteAccess(event, getRouterParam(event, 'siteId')!)
    const pages = await useDb()
        .select({
            id: schema.pages.id,
            title: schema.pages.title,
            path: schema.pages.path,
            status: schema.pages.status,
            seoTitle: schema.pages.seoTitle,
            seoDescription: schema.pages.seoDescription,
            shareImage: schema.pages.shareImage,
            noIndex: schema.pages.noIndex
        })
        .from(schema.pages)
        .where(eq(schema.pages.siteId, site.id))
        .orderBy(asc(schema.pages.position), asc(schema.pages.path))
    return { siteName: site.name, address: await liveAddress(site), seo: site.seo ?? {}, pages }
})
