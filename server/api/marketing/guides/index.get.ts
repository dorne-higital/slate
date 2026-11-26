import { and, eq } from 'drizzle-orm'

/** Published guides for slatecms.co.uk/guides, optionally in one category. Empty if no guides site is set up. */
export default defineEventHandler(async (event) => {
    const site = await marketingSite()
    if (!site) return { guides: [], categories: [] }
    const wanted = String(getQuery(event).category ?? '')
    const db = useDb()
    const categories = await db.select({ id: schema.postCategories.id, name: schema.postCategories.name, slug: schema.postCategories.slug })
        .from(schema.postCategories).where(eq(schema.postCategories.siteId, site.id)).orderBy(schema.postCategories.name)
    const category = wanted ? categories.find(c => c.slug === wanted) : undefined
    if (wanted && !category) throw createError({ statusCode: 404, statusMessage: 'No such category' })
    const guides = await livePosts(site.id, { categoryId: category?.id ?? null, limit: 100 })
    // Only categories with at least one live guide are worth showing as filters
    const all = category ? await livePosts(site.id, { limit: 100 }) : guides
    const used = new Set(all.map(g => g.category?.slug).filter(Boolean))
    setResponseHeader(event, 'cache-control', 'public, max-age=60, stale-while-revalidate=600')
    return { guides, categories: categories.filter(c => used.has(c.slug)).map(({ name, slug }) => ({ name, slug })) }
})
