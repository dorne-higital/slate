/** Fonts a site can choose, all from Google Fonts. `css` is the css2 `family=` value. */
export const SITE_FONTS = [
    { name: 'Schibsted Grotesk', css: 'Schibsted+Grotesk:wght@400;600;700;800', stack: '\'Schibsted Grotesk\', system-ui, sans-serif' },
    { name: 'Inter', css: 'Inter:wght@400;600;700;800', stack: 'Inter, system-ui, sans-serif' },
    { name: 'Baloo 2', css: 'Baloo+2:wght@500;600;700;800', stack: "'Baloo 2', system-ui, sans-serif" },
    { name: 'Quicksand', css: 'Quicksand:wght@400;500;600;700', stack: 'Quicksand, system-ui, sans-serif' },
    { name: 'Space Grotesk', css: 'Space+Grotesk:wght@400;500;600;700', stack: "'Space Grotesk', system-ui, sans-serif" },
    { name: 'Outfit', css: 'Outfit:wght@400;500;600;700;800', stack: 'Outfit, system-ui, sans-serif' },
    { name: 'Plus Jakarta Sans', css: 'Plus+Jakarta+Sans:wght@400;500;600;700;800', stack: "'Plus Jakarta Sans', system-ui, sans-serif" },
    { name: 'Instrument Serif', css: 'Instrument+Serif', stack: "'Instrument Serif', Georgia, serif" },
    { name: 'DM Sans', css: 'DM+Sans:wght@400;600;700;800', stack: '\'DM Sans\', system-ui, sans-serif' },
    { name: 'Manrope', css: 'Manrope:wght@400;600;700;800', stack: 'Manrope, system-ui, sans-serif' },
    { name: 'Fraunces', css: 'Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700', stack: 'Fraunces, Georgia, serif' },
    { name: 'Playfair Display', css: 'Playfair+Display:wght@500;600;700', stack: '\'Playfair Display\', Georgia, serif' },
    { name: 'Lora', css: 'Lora:wght@400;600;700', stack: 'Lora, Georgia, serif' },
    { name: 'Source Serif 4', css: 'Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700', stack: '\'Source Serif 4\', Georgia, serif' }
] as const

export const DEFAULT_THEME: Required<SiteTheme> = {
    primary: '#2E3445',
    dark: '#1D2230',
    soft: '#F4F5F7',
    text: '#464D5F',
    background: '#FFFFFF',
    accent: '#E8A33A',
    headingFont: 'Schibsted Grotesk',
    bodyFont: 'Schibsted Grotesk',
    headingFontCss: '',
    headingFontKind: '',
    bodyFontCss: '',
    bodyFontKind: '',
    corners: 'soft',
    scheme: 'light',
    logo: '',
    logoOnDark: '',
    logoHeight: 36,
    favicon: '',
    titleSize: 'large',
    headingSize: 'medium',
    navSize: 'medium',
    headingCase: 'none',
    navCase: 'none',
    buttonCase: 'none',
    headerStyle: 'standard',
    headerColour: 'page',
    headerSticky: false,
    headerSocials: false,
    footerStyle: 'simple',
    footerColour: 'dark'
}

export const THEME_PRESETS: { name: string, theme: SiteTheme }[] = [
    { name: 'Slate', theme: { ...DEFAULT_THEME } },
    { name: 'Workshop green', theme: { primary: '#2F5D50', dark: '#23302C', soft: '#F1EDE4', text: '#4A544F', background: '#FFFFFF', headingFont: 'Fraunces', bodyFont: 'Schibsted Grotesk', corners: 'soft' } },
    { name: 'Harbour blue', theme: { primary: '#1F5FA8', dark: '#14243A', soft: '#EEF3F9', text: '#3E4A5C', background: '#FFFFFF', headingFont: 'DM Sans', bodyFont: 'DM Sans', corners: 'round' } },
    { name: 'Terracotta', theme: { primary: '#B4532A', dark: '#3A2219', soft: '#F8EFE8', text: '#5A4A42', background: '#FFFCFA', headingFont: 'Playfair Display', bodyFont: 'Lora', corners: 'square' } },
    { name: 'Clinic', theme: { primary: '#2A7D7B', dark: '#173B3A', soft: '#EEF6F5', text: '#475957', background: '#FFFFFF', headingFont: 'Manrope', bodyFont: 'Inter', corners: 'round' } }
]

const HEX = /^#[0-9a-f]{6}$/i

/** Keeps only valid values; anything else falls back to the default when rendered. */
export function cleanTheme(input: unknown): SiteTheme {
    const t = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    const out: SiteTheme = {}
    for (const key of ['primary', 'dark', 'soft', 'text', 'background', 'accent'] as const) {
        if (typeof t[key] === 'string' && HEX.test(t[key] as string)) out[key] = (t[key] as string).toUpperCase()
    }
    // Any Google Font name; the server checks it against the full list (resolveThemeFonts) when saving
    for (const key of ['headingFont', 'bodyFont'] as const) {
        if (typeof t[key] === 'string' && /^[A-Za-z0-9 ]{2,60}$/.test(t[key] as string)) out[key] = t[key] as string
        const css = t[`${key}Css`], kind = t[`${key}Kind`]
        if (typeof css === 'string' && /^[A-Za-z0-9+]{2,80}(:wght@[0-9;]{3,40})?$/.test(css)) out[`${key}Css`] = css
        if (typeof kind === 'string' && /^[srdhm]$/.test(kind)) out[`${key}Kind`] = kind
    }
    const pick = <K extends keyof SiteTheme>(key: K, allowed: readonly string[]) => {
        if (typeof t[key] === 'string' && allowed.includes(t[key] as string)) out[key] = t[key] as SiteTheme[K]
    }
    pick('corners', ['square', 'soft', 'round'])
    pick('scheme', ['light', 'dark'])
    pick('titleSize', SIZES)
    pick('headingSize', SIZES)
    pick('navSize', ['small', 'medium', 'large'])
    for (const key of ['headingCase', 'navCase', 'buttonCase'] as const) pick(key, ['none', 'uppercase', 'capitalize'])
    pick('headerStyle', ['standard', 'centred', 'mega'])
    pick('footerStyle', ['simple', 'columns'])
    pick('headerColour', COLOUR_CHOICES)
    pick('footerColour', COLOUR_CHOICES)
    for (const key of ['headerSticky', 'headerSocials'] as const) if (typeof t[key] === 'boolean') out[key] = t[key] as boolean
    // Images: our own media addresses or https only (safeUrl also refuses javascript: etc.)
    for (const key of ['logo', 'logoOnDark', 'favicon'] as const) {
        if (typeof t[key] === 'string') {
            const v = safeUrl(String(t[key]).trim().slice(0, 1000))
            out[key] = v.startsWith('/media/') || v.startsWith('https://') ? v : ''
        }
    }
    if (typeof t.logoHeight === 'number' && t.logoHeight >= 20 && t.logoHeight <= 96) out.logoHeight = Math.round(t.logoHeight)
    return out
}

const SIZES = ['small', 'medium', 'large', 'huge'] as const
const COLOUR_CHOICES = ['page', 'soft', 'dark', 'primary', 'accent'] as const

/** Social links: each must be an https address. */
export function cleanSocials(input: unknown): SiteSocials {
    const t = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
    const out: SiteSocials = {}
    for (const key of SOCIAL_NETWORKS) {
        const v = typeof t[key] === 'string' ? (t[key] as string).trim() : ''
        if (!v) continue
        const url = /^https?:\/\//i.test(v) ? v : `https://${v.replace(/^\/+/, '')}`
        if (/^https:\/\/[^\s/]+\.[^\s]+$/i.test(url.replace(/^http:/i, 'https:'))) out[key] = url.replace(/^http:/i, 'https:').slice(0, 300)
    }
    return out
}

/** White or near-black, whichever reads better on the given background. */
export function readableOn(hex: string): string {
    const n = Number.parseInt(hex.slice(1), 16)
    const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
    })
    const lum = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
    return lum > 0.4 ? '#1D2230' : '#FFFFFF'
}

const FALLBACK: Record<string, string> = { s: 'system-ui, sans-serif', r: 'Georgia, serif', d: 'system-ui, sans-serif', h: 'cursive', m: 'ui-monospace, monospace' }

/** CSS font-family for a theme font, with a fallback that suits its kind. */
export function themeFontStack(theme: SiteTheme | null | undefined, key: 'headingFont' | 'bodyFont'): string {
    const t = { ...DEFAULT_THEME, ...theme }
    const curated = SITE_FONTS.find(f => f.name === t[key])
    if (!t[`${key}Css`] && curated) return curated.stack
    return `'${t[key]}', ${FALLBACK[t[`${key}Kind`] || 's']}`
}

/** The Google Fonts stylesheet URL for a theme's fonts. */
export function themeFontsHref(theme: SiteTheme | null | undefined): string {
    const t = { ...DEFAULT_THEME, ...theme }
    const css = (key: 'headingFont' | 'bodyFont') => t[`${key}Css`] || SITE_FONTS.find(f => f.name === t[key])?.css
    const families = [...new Set([css('headingFont'), css('bodyFont')])].filter(Boolean)
    return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`
}
