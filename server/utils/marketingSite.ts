import { and, eq, isNull } from 'drizzle-orm'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The Slate site behind slatecms.co.uk/guides and /contact (NUXT_MARKETING_SITE_ID).
 * Null when it isn't set, isn't a site ID, or the site is gone, so those pages fall back gracefully.
 */
export async function marketingSite() {
    const id = useRuntimeConfig().marketingSiteId
    if (!id || !UUID.test(id)) return null
    const site = await useDb().query.sites.findFirst({ where: and(eq(schema.sites.id, id), isNull(schema.sites.deletedAt)) })
    return site ?? null
}

/** The guides site's form called "Contact" (or its first form), which takes slatecms.co.uk/contact messages. */
export async function marketingContactForm(siteId: string) {
    const forms = await useDb().query.forms.findMany({ where: eq(schema.forms.siteId, siteId), orderBy: (f, { asc }) => [asc(f.createdAt)] })
    return forms.find(f => f.name.trim().toLowerCase() === 'contact') ?? forms[0] ?? null
}
