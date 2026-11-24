const RADIUS = { square: '0px', soft: '6px', round: '999px' } as const

/** A site's theme as CSS variables. Shared by the public site, the editor canvas and the theme preview. */
export function siteThemeVars(theme: SiteTheme | null | undefined): Record<string, string> {
    const t = { ...DEFAULT_THEME, ...theme }
    const font = (name: string) => SITE_FONTS.find(f => f.name === name)?.stack ?? 'system-ui, sans-serif'
    const dark = t.scheme === 'dark'
    // Dark scheme: the Dark colour becomes the page, with light text; soft sections are a lighter tint of it
    const bg = dark ? t.dark : t.background
    const surface = dark ? mix(t.dark, '#FFFFFF', 0.07) : t.soft
    const heading = dark ? '#FFFFFF' : t.dark
    const text = dark ? '#D5D9E1' : t.text
    const sectionColour = (c: ThemeColourChoice) => ({ page: bg, soft: surface, dark: dark ? mix(t.dark, '#000000', 0.35) : t.dark, primary: t.primary, accent: t.accent })[c]
    const header = sectionColour(t.headerColour)
    const footer = sectionColour(t.footerColour)
    return {
        '--site-bg': bg,
        '--site-surface': surface,
        '--site-heading': heading,
        '--site-dark': dark ? mix(t.dark, '#000000', 0.35) : t.dark,
        '--site-on-dark': readableOn(dark ? mix(t.dark, '#000000', 0.35) : t.dark),
        '--site-text': text,
        '--site-muted': text,
        '--site-primary': t.primary,
        '--site-primary-text': readableOn(t.primary),
        '--site-accent': t.accent,
        '--site-accent-text': readableOn(t.accent),
        // Untouched copies, so a coloured section can swap primary and its text colour without a loop
        '--theme-primary': t.primary,
        '--theme-primary-text': readableOn(t.primary),
        '--site-radius': RADIUS[t.corners],
        '--site-card-radius': t.corners === 'square' ? '0px' : '8px',
        '--site-heading-font': font(t.headingFont),
        '--site-body-font': font(t.bodyFont),
        '--site-h1-size': TITLE[t.titleSize],
        '--site-h2-size': HEADING[t.headingSize],
        '--site-nav-size': NAV[t.navSize],
        '--site-heading-case': t.headingCase,
        '--site-nav-case': t.navCase,
        '--site-button-case': t.buttonCase,
        '--site-header-bg': header,
        '--site-header-text': t.headerColour === 'page' || t.headerColour === 'soft' ? heading : readableOn(header),
        '--site-footer-bg': footer,
        '--site-footer-text': t.footerColour === 'page' || t.footerColour === 'soft' ? text : readableOn(footer),
        '--site-logo-height': `${t.logoHeight}px`
    }
}

const TITLE: Record<ThemeSize, string> = { small: 'clamp(32px, 4.5vw, 44px)', medium: 'clamp(36px, 5.2vw, 54px)', large: 'clamp(40px, 6vw, 64px)', huge: 'clamp(44px, 7.5vw, 84px)' }
const HEADING: Record<ThemeSize, string> = { small: 'clamp(24px, 3vw, 30px)', medium: 'clamp(28px, 4vw, 40px)', large: 'clamp(30px, 4.6vw, 48px)', huge: 'clamp(34px, 5.4vw, 58px)' }
const NAV = { small: '14px', medium: '15px', large: '17px' } as const

/** Blends two hex colours: amount 0 = a, 1 = b. */
function mix(a: string, b: string, amount: number) {
    const pa = Number.parseInt(a.slice(1), 16)
    const pb = Number.parseInt(b.slice(1), 16)
    const ch = (shift: number) => Math.round(((pa >> shift) & 255) * (1 - amount) + ((pb >> shift) & 255) * amount)
    return `#${[16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

/** Splits text on blank lines into paragraphs. Blocks render text as plain paragraphs, never as HTML. */
export function paragraphs(text: unknown): string[] {
    return typeof text === 'string' ? text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : []
}
