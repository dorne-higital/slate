import type { SiteTheme } from '../types'

export interface SiteThemeField {
    key: keyof SiteTheme
    cssVar: string
    label: string
    tab: 'Brand' | 'Buttons' | 'Typography' | 'Misc'
    /** Optional visual subheading within a tab — purely organizational, doesn't affect saving/rendering. */
    subgroup?: string
    /** color: swatch + hex input. font: a <select> of utils/siteFonts.ts's FONT_OPTIONS. text: free text — everything else (sizes, weights, shadows), which accepts too wide a variety of valid CSS for a single input type to constrain. */
    type: 'color' | 'font' | 'text'
    /** Must match the corresponding --site-* default in assets/styles/_site-theme.scss — SCSS can't import this file, so the two are kept in sync by hand. */
    default: string
}

export const SITE_THEME_FIELDS: SiteThemeField[] = [
    // Brand — colors
    { key: 'brandPrimary', cssVar: '--site-brand-primary', label: 'Brand primary', tab: 'Brand', subgroup: 'Colors', type: 'color', default: '#1f6f8b' },
    { key: 'brandSecondary', cssVar: '--site-brand-secondary', label: 'Brand secondary', tab: 'Brand', subgroup: 'Colors', type: 'color', default: '#175a70' },
    { key: 'brandAccent', cssVar: '--site-brand-accent', label: 'Brand accent', tab: 'Brand', subgroup: 'Colors', type: 'color', default: '#e1f0f6' },
    { key: 'link', cssVar: '--site-link', label: 'Link', tab: 'Brand', subgroup: 'Colors', type: 'color', default: '#1f6f8b' },
    { key: 'linkHover', cssVar: '--site-link-hover', label: 'Link (hover)', tab: 'Brand', subgroup: 'Colors', type: 'color', default: '#175a70' },

    // Brand — text
    { key: 'textPrimary', cssVar: '--site-text-primary', label: 'Text', tab: 'Brand', subgroup: 'Text', type: 'color', default: '#1c1c1a' },
    { key: 'textSecondary', cssVar: '--site-text-secondary', label: 'Muted text', tab: 'Brand', subgroup: 'Text', type: 'color', default: '#6b6a65' },
    { key: 'textInverse', cssVar: '--site-text-inverse', label: 'Text on brand / dark surfaces', tab: 'Brand', subgroup: 'Text', type: 'color', default: '#ffffff' },

    // Brand — surfaces
    { key: 'bgPrimary', cssVar: '--site-bg-primary', label: 'Page background', tab: 'Brand', subgroup: 'Surfaces', type: 'color', default: '#f2f1ee' },
    { key: 'bgSecondary', cssVar: '--site-bg-secondary', label: 'Card / surface background', tab: 'Brand', subgroup: 'Surfaces', type: 'color', default: '#ffffff' },
    { key: 'border', cssVar: '--site-border', label: 'Border', tab: 'Brand', subgroup: 'Surfaces', type: 'color', default: '#d9d7d1' },
    { key: 'borderStrong', cssVar: '--site-border-strong', label: 'Border (strong)', tab: 'Brand', subgroup: 'Surfaces', type: 'color', default: '#b8b5ad' },

    // Buttons
    { key: 'buttonPrimaryBg', cssVar: '--site-button-primary-bg', label: 'Background', tab: 'Buttons', subgroup: 'Primary', type: 'color', default: '#1f6f8b' },
    { key: 'buttonPrimaryText', cssVar: '--site-button-primary-text', label: 'Text', tab: 'Buttons', subgroup: 'Primary', type: 'color', default: '#ffffff' },
    { key: 'buttonPrimaryHoverBg', cssVar: '--site-button-primary-hover-bg', label: 'Background (hover)', tab: 'Buttons', subgroup: 'Primary', type: 'color', default: '#175a70' },

    { key: 'buttonSecondaryBg', cssVar: '--site-button-secondary-bg', label: 'Background', tab: 'Buttons', subgroup: 'Secondary', type: 'color', default: '#e1f0f6' },
    { key: 'buttonSecondaryText', cssVar: '--site-button-secondary-text', label: 'Text', tab: 'Buttons', subgroup: 'Secondary', type: 'color', default: '#1f6f8b' },
    { key: 'buttonSecondaryBorder', cssVar: '--site-button-secondary-border', label: 'Border', tab: 'Buttons', subgroup: 'Secondary', type: 'color', default: '#d9d7d1' },
    { key: 'buttonSecondaryHoverBg', cssVar: '--site-button-secondary-hover-bg', label: 'Background (hover)', tab: 'Buttons', subgroup: 'Secondary', type: 'color', default: '#cde6f0' },

    { key: 'buttonTertiaryText', cssVar: '--site-button-tertiary-text', label: 'Text', tab: 'Buttons', subgroup: 'Tertiary', type: 'color', default: '#1c1c1a' },
    { key: 'buttonTertiaryHoverBg', cssVar: '--site-button-tertiary-hover-bg', label: 'Background (hover)', tab: 'Buttons', subgroup: 'Tertiary', type: 'color', default: '#ffffff' },

    { key: 'buttonOutlineText', cssVar: '--site-button-outline-text', label: 'Text', tab: 'Buttons', subgroup: 'Outline', type: 'color', default: '#1f6f8b' },
    { key: 'buttonOutlineBorder', cssVar: '--site-button-outline-border', label: 'Border', tab: 'Buttons', subgroup: 'Outline', type: 'color', default: '#1f6f8b' },
    { key: 'buttonOutlineHoverBg', cssVar: '--site-button-outline-hover-bg', label: 'Background (hover)', tab: 'Buttons', subgroup: 'Outline', type: 'color', default: '#e6f2f6' },

    // Typography — fonts
    { key: 'headingFontFamily', cssVar: '--site-heading-font-family', label: 'Heading font', tab: 'Typography', subgroup: 'Fonts', type: 'font', default: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" },
    { key: 'bodyFontFamily', cssVar: '--site-body-font-family', label: 'Body font', tab: 'Typography', subgroup: 'Fonts', type: 'font', default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },

    // Typography — sizes
    { key: 'heroSize', cssVar: '--site-hero-size', label: 'Hero', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: 'clamp(3.5rem, 7vw, 4.5rem)' },
    { key: 'h1Size', cssVar: '--site-h1-size', label: 'H1', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '3.5rem' },
    { key: 'h2Size', cssVar: '--site-h2-size', label: 'H2', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '2.5rem' },
    { key: 'h3Size', cssVar: '--site-h3-size', label: 'H3', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '1.75rem' },
    { key: 'h4Size', cssVar: '--site-h4-size', label: 'H4', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '1.25rem' },
    { key: 'h5Size', cssVar: '--site-h5-size', label: 'H5', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '1.0625rem' },
    { key: 'h6Size', cssVar: '--site-h6-size', label: 'H6', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '0.9375rem' },
    { key: 'eyebrowSize', cssVar: '--site-eyebrow-size', label: 'Eyebrow', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '0.9375rem' },
    { key: 'buttonSize', cssVar: '--site-button-size', label: 'Button', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '0.9375rem' },
    { key: 'navigationSize', cssVar: '--site-navigation-size', label: 'Navigation', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '0.9375rem' },
    { key: 'bodySize', cssVar: '--site-body-size', label: 'Body', tab: 'Typography', subgroup: 'Sizes', type: 'text', default: '1.0625rem' },

    // Typography — weights
    { key: 'headingFontWeight', cssVar: '--site-heading-font-weight', label: 'Heading', tab: 'Typography', subgroup: 'Weights', type: 'text', default: '700' },
    { key: 'buttonFontWeight', cssVar: '--site-button-font-weight', label: 'Button', tab: 'Typography', subgroup: 'Weights', type: 'text', default: '600' },
    { key: 'navigationFontWeight', cssVar: '--site-navigation-font-weight', label: 'Navigation', tab: 'Typography', subgroup: 'Weights', type: 'text', default: '600' },
    { key: 'bodyFontWeight', cssVar: '--site-body-font-weight', label: 'Body', tab: 'Typography', subgroup: 'Weights', type: 'text', default: '400' },

    // Misc — semantic colors
    { key: 'success', cssVar: '--site-success', label: 'Success', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#1f6f8b' },
    { key: 'successBg', cssVar: '--site-success-bg', label: 'Success background', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#dcedf5' },
    { key: 'error', cssVar: '--site-error', label: 'Error', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#a8285a' },
    { key: 'errorBg', cssVar: '--site-error-bg', label: 'Error background', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#fbe4ea' },
    { key: 'warning', cssVar: '--site-warning', label: 'Warning', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#8a6d1a' },
    { key: 'warningBg', cssVar: '--site-warning-bg', label: 'Warning background', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#f6efd8' },
    { key: 'info', cssVar: '--site-info', label: 'Info', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#1f6f8b' },
    { key: 'infoBg', cssVar: '--site-info-bg', label: 'Info background', tab: 'Misc', subgroup: 'Semantic colors', type: 'color', default: '#e1f0f6' },

    // Misc — radius
    { key: 'borderRadiusSm', cssVar: '--site-border-radius-sm', label: 'Small', tab: 'Misc', subgroup: 'Radius', type: 'text', default: '4px' },
    { key: 'borderRadiusMd', cssVar: '--site-border-radius-md', label: 'Medium', tab: 'Misc', subgroup: 'Radius', type: 'text', default: '8px' },
    { key: 'borderRadiusLg', cssVar: '--site-border-radius-lg', label: 'Large', tab: 'Misc', subgroup: 'Radius', type: 'text', default: '12px' },
    { key: 'borderRadiusPill', cssVar: '--site-border-radius-pill', label: 'Pill', tab: 'Misc', subgroup: 'Radius', type: 'text', default: '999px' },

    // Misc — shadows
    { key: 'shadowSm', cssVar: '--site-shadow-sm', label: 'Small', tab: 'Misc', subgroup: 'Shadows', type: 'text', default: '0 1px 2px rgb(0 0 0 / 8%)' },
    { key: 'shadowMd', cssVar: '--site-shadow-md', label: 'Medium', tab: 'Misc', subgroup: 'Shadows', type: 'text', default: '0 4px 10px rgb(0 0 0 / 12%)' },
    { key: 'shadowLg', cssVar: '--site-shadow-lg', label: 'Large', tab: 'Misc', subgroup: 'Shadows', type: 'text', default: '0 10px 24px rgb(0 0 0 / 16%)' },

    // Misc — spacing
    { key: 'paddingXs', cssVar: '--site-padding-xs', label: 'XS', tab: 'Misc', subgroup: 'Spacing', type: 'text', default: '0.5rem' },
    { key: 'paddingSm', cssVar: '--site-padding-sm', label: 'SM', tab: 'Misc', subgroup: 'Spacing', type: 'text', default: '1rem' },
    { key: 'paddingMd', cssVar: '--site-padding-md', label: 'MD', tab: 'Misc', subgroup: 'Spacing', type: 'text', default: '1.5rem' },
    { key: 'paddingLg', cssVar: '--site-padding-lg', label: 'LG', tab: 'Misc', subgroup: 'Spacing', type: 'text', default: '2.5rem' },
    { key: 'paddingXl', cssVar: '--site-padding-xl', label: 'XL', tab: 'Misc', subgroup: 'Spacing', type: 'text', default: '4rem' }
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
