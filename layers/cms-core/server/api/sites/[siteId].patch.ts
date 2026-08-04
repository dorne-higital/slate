import { requireSiteAccess } from '../../utils/requireSiteAccess'
import type { Database } from '../../../types/database.types'
import type { DayHours, DayOfWeek, SiteAddress, SiteBranding, SiteCompanyInfo, SiteLayout, SiteTheme, SocialLink } from '../../../types'
import { SITE_THEME_FIELDS } from '../../../utils/siteTheme'
import { HEADER_STYLES, FOOTER_STYLES } from '../../../utils/siteLayoutStyles'
import { addDomainToVercel, domainCounterpart, removeDomainFromVercel } from '../../utils/vercelDomains'

interface UpdateSiteBody {
    name?: string
    slug?: string
    customDomain?: string | null
    theme?: SiteTheme | null
    layout?: SiteLayout | null
    branding?: SiteBranding | null
    companyInfo?: SiteCompanyInfo | null
}

type SiteUpdate = Database['public']['Tables']['sites']['Update']

const THEME_KEYS = new Set(SITE_THEME_FIELDS.map(field => field.key))
const HEADER_STYLE_KEYS = new Set(HEADER_STYLES.map(style => style.key))
const FOOTER_STYLE_KEYS = new Set(FOOTER_STYLES.map(style => style.key))

// Same "unset means built-in default" convention as normalizeTheme below
// — an unknown/blank style key is dropped rather than saved, so a style
// removed from utils/siteLayoutStyles.ts later doesn't leave a site
// permanently pointed at nothing.
function normalizeLayout(layout: SiteLayout | null): SiteLayout | null {
    if (!layout) return null

    const normalized: SiteLayout = {}
    if (layout.header && HEADER_STYLE_KEYS.has(layout.header)) normalized.header = layout.header
    if (layout.footer && FOOTER_STYLE_KEYS.has(layout.footer)) normalized.footer = layout.footer
    return Object.keys(normalized).length > 0 ? normalized : null
}

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

const BRANDING_KEYS = new Set<keyof SiteBranding>(['logoLight', 'logoDark', 'favicon'])

// Same "trim, drop blanks" shape as normalizeTheme — values here are
// Media Library URLs (via ImagePicker), not free text, but a value could
// still arrive as an empty string when a picker's "Remove" was clicked.
function normalizeBranding(branding: SiteBranding | null): SiteBranding | null {
    if (!branding) return null

    const normalized: SiteBranding = {}
    for (const [key, value] of Object.entries(branding)) {
        if (!BRANDING_KEYS.has(key as keyof SiteBranding)) continue
        const trimmed = typeof value === 'string' ? value.trim() : ''
        if (trimmed) normalized[key as keyof SiteBranding] = trimmed
    }
    return Object.keys(normalized).length > 0 ? normalized : null
}

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const ADDRESS_KEYS = ['businessName', 'line1', 'line2', 'town', 'city', 'postcode', 'email', 'phone'] as const

function normalizeCompanyInfo(companyInfo: SiteCompanyInfo | null): SiteCompanyInfo | null {
    if (!companyInfo) return null

    const normalized: SiteCompanyInfo = {}

    const address: SiteAddress = {}
    for (const key of ADDRESS_KEYS) {
        const value = companyInfo.address?.[key]?.trim()
        if (value) address[key] = value
    }
    if (Object.keys(address).length > 0) normalized.address = address

    const openingHours: Partial<Record<DayOfWeek, DayHours>> = {}
    for (const day of DAYS_OF_WEEK) {
        const hours = companyInfo.openingHours?.[day]
        if (!hours) continue

        if (hours.closed) {
            openingHours[day] = { closed: true }
            continue
        }

        const open = hours.open?.trim()
        const close = hours.close?.trim()
        if (open || close) {
            openingHours[day] = { ...(open ? { open } : {}), ...(close ? { close } : {}) }
        }
    }
    if (Object.keys(openingHours).length > 0) normalized.openingHours = openingHours

    const socials: SocialLink[] = (companyInfo.socials ?? [])
        .map((social): SocialLink => ({
            id: typeof social.id === 'string' && social.id ? social.id : crypto.randomUUID(),
            platform: social.platform?.trim() ?? '',
            url: social.url?.trim() ?? ''
        }))
        .filter(social => social.platform && social.url)
    if (socials.length > 0) normalized.socials = socials

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
    if (body.layout !== undefined) update.layout = normalizeLayout(body.layout)
    if (body.branding !== undefined) update.branding = normalizeBranding(body.branding)
    if (body.companyInfo !== undefined) update.company_info = normalizeCompanyInfo(body.companyInfo)

    let previousDomain: string | null = null
    let vercelWarning: string | undefined

    if (body.customDomain !== undefined) {
        const { data: current } = await client.from('sites').select('custom_domain').eq('id', siteId).single()
        previousDomain = current?.custom_domain ?? null

        // Registering with Vercel happens before the DB write for a new/
        // changed domain — if Vercel rejects it (already claimed by
        // another project, invalid, etc.) the site should keep showing
        // its old value rather than "saving" a domain that will never
        // actually route any traffic.
        if (update.custom_domain) {
            if (update.custom_domain !== previousDomain) {
                await addDomainToVercel(update.custom_domain)
            }

            // Also register the www/apex sibling as a redirect back to
            // the canonical domain the customer actually typed — without
            // this, only the exact hostname they entered would ever
            // work, and jbcleaning.co.uk vs www.jbcleaning.co.uk would
            // look broken depending on which one a visitor happens to
            // type. Re-attempted on every save (not just when the domain
            // changes) so it's self-healing if it failed previously, or
            // for a domain saved before this existed.
            try {
                await addDomainToVercel(domainCounterpart(update.custom_domain), update.custom_domain)
            } catch (counterpartError) {
                vercelWarning = `Saved, but couldn't also register ${domainCounterpart(update.custom_domain)}: ${counterpartError instanceof Error ? counterpartError.message : 'unknown error'}. ${update.custom_domain} still works on its own.`
            }
        }
    }

    const { data, error } = await client
        .from('sites')
        .update(update)
        .eq('id', siteId)
        .select()
        .single()

    if (error) {
        throw createError({ statusCode: 400, statusMessage: error.message })
    }

    // Cleanup, not the source of truth — if this fails, the site's own
    // record (already saved above) is what matters; a stale Vercel
    // registration left behind is a lesser problem than blocking the
    // customer from clearing their domain in Settings.
    if (previousDomain && previousDomain !== update.custom_domain) {
        try {
            await removeDomainFromVercel(previousDomain)
            await removeDomainFromVercel(domainCounterpart(previousDomain))
        } catch (cleanupError) {
            vercelWarning = `Saved, but couldn't remove "${previousDomain}" from Vercel: ${cleanupError instanceof Error ? cleanupError.message : 'unknown error'}`
        }
    }

    return { site: data, vercelWarning }
})
