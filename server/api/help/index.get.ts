/** Every help article, grouped by area, for slatecms.co.uk/help. */
export default defineEventHandler((event) => {
    setResponseHeader(event, 'cache-control', 'public, max-age=300')
    const articles = helpArticles()
    return {
        areas: HELP_AREAS.map(a => ({
            key: a.key,
            name: a.name,
            blurb: a.blurb,
            icon: a.icon,
            articles: articles.filter(x => x.area === a.key).map(({ slug, title, summary, popular }) => ({ slug, title, summary, popular }))
        })).filter(a => a.articles.length)
    }
})
