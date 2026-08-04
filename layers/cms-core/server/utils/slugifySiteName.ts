/** Turns a free-text site name into a URL-safe slug candidate — not guaranteed unique, callers still need to handle a duplicate-slug insert error. */
export function slugifySiteName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
