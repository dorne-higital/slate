import { describe, expect, it } from 'vitest'
import { cleanTheme, themeFontsHref, themeFontStack } from '../../shared/utils/siteTheme'
import { findGoogleFont, fontCss, googleFonts } from '../../shared/utils/fontCatalogue'

describe('cleanTheme', () => {
    it('keeps valid colours and drops anything else', () => {
        const t = cleanTheme({ primary: '#e63946', dark: 'red', text: '#12345', background: 'url(x)' })
        expect(t.primary).toBe('#E63946')
        expect(t).not.toHaveProperty('dark')
        expect(t).not.toHaveProperty('text')
        expect(t).not.toHaveProperty('background')
    })
    it('only keeps font names and stylesheet values that can’t break out of a URL or CSS', () => {
        const t = cleanTheme({ headingFont: "Inter'; }", headingFontCss: 'x&family=Evil', bodyFont: 'DM Sans', bodyFontCss: 'DM+Sans:wght@400;700', bodyFontKind: 's' })
        expect(t).not.toHaveProperty('headingFont')
        expect(t).not.toHaveProperty('headingFontCss')
        expect(t.bodyFont).toBe('DM Sans')
        expect(t.bodyFontCss).toBe('DM+Sans:wght@400;700')
    })
})

describe('fonts', () => {
    it('has the Google Fonts list, most popular first', () => {
        expect(googleFonts().length).toBeGreaterThan(1000)
        expect(googleFonts()[0]!.name).toBe('Roboto')
        expect(findGoogleFont('Not A Font')).toBeUndefined()
    })
    it('asks Google only for weights a font has', () => {
        expect(fontCss(findGoogleFont('Pacifico')!)).toBe('Pacifico')
        expect(fontCss(findGoogleFont('Baloo 2')!)).toBe('Baloo+2:wght@400;500;600;700;800')
        expect(fontCss(findGoogleFont('Quicksand')!)).toBe('Quicksand:wght@400;500;600;700')
    })
    it('builds the stylesheet link and font stack from the saved theme', () => {
        const theme = { headingFont: 'Pacifico', headingFontCss: 'Pacifico', headingFontKind: 'h', bodyFont: 'Inter' }
        expect(themeFontsHref(theme)).toContain('family=Pacifico')
        expect(themeFontsHref(theme)).toContain('family=Inter')
        expect(themeFontStack(theme, 'headingFont')).toBe("'Pacifico', cursive")
    })
})

describe('app store links', () => {
    it('keeps real App Store and Google Play pages only', async () => {
        const { cleanSocials } = await import('../../shared/utils/siteTheme')
        expect(cleanSocials({ appStore: 'apps.apple.com/gb/app/dobie-dash/id123', googlePlay: 'https://play.google.com/store/apps/details?id=co.dobie' }))
            .toEqual({ appStore: 'https://apps.apple.com/gb/app/dobie-dash/id123', googlePlay: 'https://play.google.com/store/apps/details?id=co.dobie' })
        expect(cleanSocials({ appStore: 'https://evil.example/apps.apple.com', googlePlay: 'javascript:alert(1)' })).toEqual({})
    })
})
