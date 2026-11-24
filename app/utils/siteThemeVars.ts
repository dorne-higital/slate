const RADIUS = { square: '0px', soft: '6px', round: '999px' } as const

/** A site's theme as CSS variables. Shared by the public site, the editor canvas and the theme preview. */
export function siteThemeVars(theme: SiteTheme | null | undefined): Record<string, string> {
    const t = { ...DEFAULT_THEME, ...theme }
    const font = (name: string) => SITE_FONTS.find(f => f.name === name)?.stack ?? 'system-ui, sans-serif'
    return {
        '--site-bg': t.background,
        '--site-surface': t.soft,
        '--site-heading': t.dark,
        '--site-dark': t.dark,
        '--site-on-dark': readableOn(t.dark),
        '--site-text': t.text,
        '--site-muted': t.text,
        '--site-primary': t.primary,
        '--site-primary-text': readableOn(t.primary),
        '--site-radius': RADIUS[t.corners],
        '--site-card-radius': t.corners === 'square' ? '0px' : '8px',
        '--site-heading-font': font(t.headingFont),
        '--site-body-font': font(t.bodyFont)
    }
}

/** Splits text on blank lines into paragraphs. Blocks render text as plain paragraphs, never as HTML. */
export function paragraphs(text: unknown): string[] {
    return typeof text === 'string' ? text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean) : []
}
