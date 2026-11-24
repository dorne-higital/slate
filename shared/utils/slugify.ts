/** "Bramble & Oak Upholstery" → "bramble-and-oak-upholstery" */
export function slugify(input: string): string {
    return input
        .toLowerCase()
        .replace(/&/g, 'and')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48)
}

/** Subdomains that would clash with Slate's own hosts or routes. */
export const RESERVED_SLUGS = new Set(['admin', 'api', 'app', 'auth', 'cms', 'login', 'mail', 'preview', 'sites', 'www'])
