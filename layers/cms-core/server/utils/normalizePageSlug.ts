/**
 * A page's slug is one path *segment*, matched literally against the URL
 * by server/api/public/site-page.get.ts (`page.slug === segment`) — a
 * leading/trailing slash left in from someone typing "/about" instead of
 * "about" means it can never match, silently 404ing forever. Stripping
 * it here (not just trimming whitespace, as the two routes that call
 * this used to) is the fix. An internal slash is rejected outright
 * rather than silently stripped, since "about/us" can't mean anything
 * here — nesting is expressed via parent_id, not slashes within a slug.
 */
export function normalizePageSlug(raw: string): string {
    const slug = raw.trim().replace(/^\/+|\/+$/g, '')
    if (slug.includes('/')) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Slug cannot contain "/" — nested pages are created via the parent page picker, not slashes in the slug'
        })
    }
    return slug
}
