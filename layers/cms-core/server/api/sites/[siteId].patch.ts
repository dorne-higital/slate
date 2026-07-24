import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { Database } from '../../../types/database.types'
import type { SiteTheme } from '../../../types'
import { SITE_THEME_FIELDS } from '../../../utils/siteTheme'

interface UpdateSiteBody {
    name?: string
    slug?: string
    customDomain?: string | null
    theme?: SiteTheme | null
}

type SiteUpdate = Database['public']['Tables']['sites']['Update']

const THEME_KEYS = new Set(SITE_THEME_FIELDS.map(field => field.key))

// Trims every value and drops any key that isn't a known theme field —
// values themselves aren't validated as real CSS colors, since they're
// applied via Vue's :style binding (element.style.setProperty), which
// simply no-ops on an invalid value rather than being an injection risk;
// the allowlist here is only to stop the jsonb column from accumulating
// unbounded, unused keys over time.
function normalizeTheme(theme: SiteTheme | null): SiteTheme | null {
    if (!theme) return null

    const normalized: SiteTheme = {}
    for (const [key, value] of Object.entries(theme)) {
        if (!THEME_KEYS.has(key as keyof SiteTheme)) continue
        const trimmed = typeof value === 'string' ? value.trim() : ''
        if (trimmed) normalized[key as keyof SiteTheme] = trimmed
    }
    return Object.keys(normalized).length > 0 ? normalized : null
}

export default defineEventHandler(async (event) => {
    const siteId = getRouterParam(event, 'siteId')

    if (!siteId) {
        throw createError({ statusCode: 400, statusMessage: 'siteId is required' })
    }

    const body = await readBody<UpdateSiteBody>(event)
    const { client } = await requireSiteAccess(event, siteId, 'admin')

    const update: SiteUpdate = {}

    if (body.name !== undefined) update.name = body.name.trim()
    if (body.slug !== undefined) update.slug = body.slug.trim()
    if (body.customDomain !== undefined) {
        update.custom_domain = body.customDomain ? body.customDomain.trim().toLowerCase() : null
    }
    if (body.theme !== undefined) update.theme = normalizeTheme(body.theme)

    const { data, error } = await client
        .from('sites')
        .update(update)
        .eq('id', siteId)
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    return { site: data }
})
