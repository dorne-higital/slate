// Google Fonts lookups. Only the server and the Theme page use this (it pulls in the ~35 KB list);
// saved themes carry each font's stylesheet value, so client sites never load the list.
export type FontKind = 's' | 'r' | 'd' | 'h' | 'm'
export interface GoogleFont { name: string, kind: FontKind, variable: boolean, weights: number[] }

export const FONT_KINDS: { key: FontKind, label: string }[] = [
    { key: 's', label: 'Sans serif' },
    { key: 'r', label: 'Serif' },
    { key: 'd', label: 'Display' },
    { key: 'h', label: 'Handwriting' },
    { key: 'm', label: 'Monospace' }
]

let list: GoogleFont[] | null = null
export function googleFonts(): GoogleFont[] {
    if (!list) {
        list = GOOGLE_FONTS_RAW.split('\n').map((row) => {
            const [name, kind, w] = row.split('|') as [string, FontKind, string]
            const variable = w.includes('-')
            return { name, kind, variable, weights: variable ? w.split('-').map(Number) : w.split(',').map(Number) }
        })
    }
    return list
}

export function findGoogleFont(name: unknown): GoogleFont | undefined {
    return typeof name === 'string' ? googleFonts().find(f => f.name === name) : undefined
}

const WANTED = [400, 500, 600, 700, 800]

/** The css2 `family=` value, asking only for weights the font has (Google rejects the rest). */
export function fontCss(f: GoogleFont): string {
    let weights: number[]
    if (f.variable) {
        const [min, max] = f.weights as [number, number]
        weights = WANTED.filter(w => w >= min && w <= max)
        if (!weights.length) weights = [min]
    } else {
        weights = WANTED.filter(w => f.weights.includes(w))
        if (!weights.length) weights = f.weights
    }
    const family = f.name.replace(/ /g, '+')
    return weights.length === 1 && weights[0] === 400 ? family : `${family}:wght@${weights.join(';')}`
}
