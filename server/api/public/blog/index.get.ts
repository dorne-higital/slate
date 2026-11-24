import { asc, eq } from 'drizzle-orm'

/** The blog index for the site on this Host, optionally filtered to one category. */
export default defineEventHandler(async (event) => {
    const site = await resolveTenant(event)
    if (!site) throw createError({ statusCode: 404, statusMessage: 'Site not found' })
    const db = useDb()

    const categories = await db.select({ id: schema.postCategories.id, name: schema.postCategories.name, slug: schema.postCategories.slug })
        .from(schema.postCategories).where(eq(schema.postCategories.siteId, site.id)).orderBy(asc(schema.postCategories.name))
    const wanted = String(getQuery(event).category ?? '')
    const category = wanted ? categories.find(c => c.slug === wanted) ?? null : null
    if (wanted && !category) throw createError({ statusCode: 404, statusMessage: 'Category not found' })

    const [shell, posts] = await Promise.all([publicShell(site), livePosts(site.id, { categoryId: category?.id })])
    setResponseHeader(event, 'cache-control', 'public, max-age=30, stale-while-revalidate=300')
    return { ...shell, posts, categories: categories.map(({ name, slug }) => ({ name, slug })), category: category ? { name: category.name, slug: category.slug } : null }
})
