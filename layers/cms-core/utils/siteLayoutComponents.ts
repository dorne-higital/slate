// Maps a header/footer style key (utils/siteLayoutStyles.ts) to the Vue
// component that renders it — same "registry of string -> component
// name, resolved via <component :is>" pattern as utils/blockComponents.ts,
// so the picker (which only deals in keys) and the renderer never drift.
export const HEADER_STYLE_COMPONENTS: Record<string, string> = {
    default: 'SiteHeaderDefault'
}

export const FOOTER_STYLE_COMPONENTS: Record<string, string> = {
    default: 'SiteFooterDefault'
}

export function resolveHeaderStyleComponent(key: string | undefined) {
    return HEADER_STYLE_COMPONENTS[key ?? 'default'] ?? HEADER_STYLE_COMPONENTS.default
}

export function resolveFooterStyleComponent(key: string | undefined) {
    return FOOTER_STYLE_COMPONENTS[key ?? 'default'] ?? FOOTER_STYLE_COMPONENTS.default
}
