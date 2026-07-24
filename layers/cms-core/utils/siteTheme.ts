import type { SiteTheme } from '../types'

export interface SiteThemeField {
    key: keyof SiteTheme
    cssVar: string
    label: string
    group: 'Brand' | 'Text' | 'Backgrounds' | 'Links' | 'Borders'
    /** Must match the corresponding --site-* default in assets/styles/_site-theme.scss — SCSS can't import this file, so the two are kept in sync by hand. */
    default: string
}

export const SITE_THEME_FIELDS: SiteThemeField[] = [
    { key: 'brandPrimary', cssVar: '--site-brand-primary', label: 'Brand primary', group: 'Brand', default: '#1f6f8b' },
    { key: 'brandPrimaryHover', cssVar: '--site-brand-primary-hover', label: 'Brand primary (hover)', group: 'Brand', default: '#175a70' },
    { key: 'brandContrast', cssVar: '--site-brand-contrast', label: 'Text on brand', group: 'Brand', default: '#ffffff' },
    { key: 'textPrimary', cssVar: '--site-text-primary', label: 'Text', group: 'Text', default: '#1c1c1a' },
    { key: 'textSecondary', cssVar: '--site-text-secondary', label: 'Muted text', group: 'Text', default: '#6b6a65' },
    { key: 'bgSurface', cssVar: '--site-bg-surface', label: 'Surface background', group: 'Backgrounds', default: '#eae9e5' },
    { key: 'bgSurfaceAccent', cssVar: '--site-bg-surface-accent', label: 'Accent surface background', group: 'Backgrounds', default: '#e1f0f6' },
    { key: 'link', cssVar: '--site-link', label: 'Link', group: 'Links', default: '#1f6f8b' },
    { key: 'linkHover', cssVar: '--site-link-hover', label: 'Link (hover)', group: 'Links', default: '#175a70' },
    { key: 'border', cssVar: '--site-border', label: 'Border', group: 'Borders', default: '#d9d7d1' }
]

/**
 * Only emits a variable for fields the theme actually sets — an unset
 * field should inherit the :root default declared in _site-theme.scss,
 * not get overridden with a duplicate of that same default here.
 */
export function themeToCssVars(theme: SiteTheme | null | undefined): Record<string, string> {
    if (!theme) return {}

    const vars: Record<string, string> = {}
    for (const field of SITE_THEME_FIELDS) {
        const value = theme[field.key]
        if (value) vars[field.cssVar] = value
    }
    return vars
}
