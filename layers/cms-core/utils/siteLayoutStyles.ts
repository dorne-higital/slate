import type { MenuSlot } from '../types'

export interface LayoutStyle {
    key: string
    label: string
    description: string
    /** Which menu slot(s) this style looks up and renders. */
    slots: MenuSlot[]
}

// Only one style each for now — the picker UI and the header_main/
// footer_main/footer_legal slot plumbing are built to take more without
// changes elsewhere: add an entry here, a matching component to
// utils/siteLayoutComponents.ts, and it shows up in the picker.
export const HEADER_STYLES: LayoutStyle[] = [
    {
        key: 'default',
        label: 'Default',
        description: 'Site name on the left, a single nav row on the right.',
        slots: ['header_main']
    }
]

export const FOOTER_STYLES: LayoutStyle[] = [
    {
        key: 'default',
        label: 'Default',
        description: 'Site name, a main links row, a legal row, and a copyright line.',
        slots: ['footer_main', 'footer_legal']
    }
]

export const DEFAULT_HEADER_STYLE = 'default'
export const DEFAULT_FOOTER_STYLE = 'default'

export function headerStyleFor(key: string | undefined): LayoutStyle {
    return HEADER_STYLES.find(style => style.key === key) ?? HEADER_STYLES[0]!
}

export function footerStyleFor(key: string | undefined): LayoutStyle {
    return FOOTER_STYLES.find(style => style.key === key) ?? FOOTER_STYLES[0]!
}

export const MENU_SLOT_LABELS: Record<MenuSlot, string> = {
    header_main: 'Header main',
    footer_main: 'Footer main',
    footer_legal: 'Footer legal'
}
