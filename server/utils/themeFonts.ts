/** Checks a theme's fonts against Google Fonts and stores each one's stylesheet value and kind. Unknown fonts are dropped (the default is used). */
export function resolveThemeFonts(theme: SiteTheme): SiteTheme {
    const out = { ...theme }
    for (const key of ['headingFont', 'bodyFont'] as const) {
        delete out[`${key}Css`]
        delete out[`${key}Kind`]
        if (!out[key]) continue
        const f = findGoogleFont(out[key])
        if (!f) {
            delete out[key]
            continue
        }
        out[`${key}Css`] = fontCss(f)
        out[`${key}Kind`] = f.kind
    }
    return out
}
