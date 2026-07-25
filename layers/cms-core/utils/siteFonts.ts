export interface FontOption {
    label: string
    stack: string
    google?: { family: string, weights: number[] }
}

// A curated set, not the full Google Fonts catalog (1500+) — enough
// variety (sans/serif/display, a few weights each) without turning the
// dropdown into an unusable wall of names. System options first since
// they're what the theme defaults to (see utils/siteTheme.ts) and need
// no network request at all.
export const FONT_OPTIONS: FontOption[] = [
    { label: 'System Sans', stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { label: 'System Serif', stack: "Georgia, 'Iowan Old Style', 'Times New Roman', serif" },
    { label: 'Georgia', stack: 'Georgia, serif' },
    { label: 'Times New Roman', stack: "'Times New Roman', Times, serif" },
    { label: 'Arial', stack: 'Arial, Helvetica, sans-serif' },
    { label: 'Courier New', stack: "'Courier New', Courier, monospace" },
    { label: 'Inter', stack: "'Inter', sans-serif", google: { family: 'Inter', weights: [400, 500, 600, 700] } },
    { label: 'Roboto', stack: "'Roboto', sans-serif", google: { family: 'Roboto', weights: [400, 500, 700] } },
    { label: 'Open Sans', stack: "'Open Sans', sans-serif", google: { family: 'Open+Sans', weights: [400, 600, 700] } },
    { label: 'Poppins', stack: "'Poppins', sans-serif", google: { family: 'Poppins', weights: [400, 600, 700] } },
    { label: 'Montserrat', stack: "'Montserrat', sans-serif", google: { family: 'Montserrat', weights: [400, 600, 700] } },
    { label: 'Nunito', stack: "'Nunito', sans-serif", google: { family: 'Nunito', weights: [400, 600, 700] } },
    { label: 'Raleway', stack: "'Raleway', sans-serif", google: { family: 'Raleway', weights: [400, 600, 700] } },
    { label: 'Space Grotesk', stack: "'Space Grotesk', sans-serif", google: { family: 'Space+Grotesk', weights: [400, 500, 700] } },
    { label: 'Playfair Display', stack: "'Playfair Display', serif", google: { family: 'Playfair+Display', weights: [400, 700] } },
    { label: 'Merriweather', stack: "'Merriweather', serif", google: { family: 'Merriweather', weights: [400, 700] } },
    { label: 'Lora', stack: "'Lora', serif", google: { family: 'Lora', weights: [400, 600, 700] } },
    { label: 'Source Serif 4', stack: "'Source Serif 4', serif", google: { family: 'Source+Serif+4', weights: [400, 600, 700] } },
    { label: 'Bitter', stack: "'Bitter', serif", google: { family: 'Bitter', weights: [400, 700] } },
    { label: 'DM Serif Display', stack: "'DM Serif Display', serif", google: { family: 'DM+Serif+Display', weights: [400] } }
]

export function findFontOption(stack: string | undefined): FontOption | undefined {
    return FONT_OPTIONS.find(option => option.stack === stack)
}

interface FontFamilyTheme {
    headingFontFamily?: string
    bodyFontFamily?: string
}

/**
 * Builds the Google Fonts stylesheet link(s) needed for whichever of a
 * theme's font fields resolve to a known Google Font — call this
 * wherever site content actually renders with a given theme (the public
 * site, the theme editor's own live preview, the page builder canvas),
 * never for the admin app's own chrome, which doesn't use these fonts.
 * One combined request when both heading and body pick Google Fonts,
 * not two separate round trips.
 */
type FontLink = { rel: 'preconnect', href: string, crossorigin?: 'anonymous' } | { rel: 'stylesheet', href: string }

export function googleFontLinksFor(theme: FontFamilyTheme | null | undefined): FontLink[] {
    if (!theme) return []

    const families = new Set<string>()
    for (const stack of [theme.headingFontFamily, theme.bodyFontFamily]) {
        const option = findFontOption(stack)
        if (option?.google) {
            families.add(`family=${option.google.family}:wght@${option.google.weights.join(';')}`)
        }
    }
    if (families.size === 0) return []

    return [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?${Array.from(families).join('&')}&display=swap` }
    ]
}
