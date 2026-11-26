/** One help article, with the related ones. */
export default defineEventHandler((event) => {
    const a = helpArticle(getRouterParam(event, 'slug') ?? '')
    if (!a) throw createError({ statusCode: 404, statusMessage: 'Help article not found' })
    setResponseHeader(event, 'cache-control', 'public, max-age=300')
    const area = HELP_AREAS.find(x => x.key === a.area)!
    const related = a.related.map(s => helpArticle(s)).filter(Boolean).map(r => ({ slug: r!.slug, title: r!.title, summary: r!.summary }))
    return { article: { slug: a.slug, title: a.title, summary: a.summary, area: a.area, areaName: area.name, html: a.html, steps: a.steps }, related }
})
