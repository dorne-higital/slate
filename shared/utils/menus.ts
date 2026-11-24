export const MENU_SLOTS: { slot: MenuSlot, name: string, help: string }[] = [
    { slot: 'header', name: 'Header', help: 'The links along the top of every page.' },
    { slot: 'footer', name: 'Footer', help: 'Links at the bottom of every page.' },
    { slot: 'legal', name: 'Footer small print', help: 'Privacy, terms and other small links under the footer.' }
]

/** Keeps only well-formed items with safe links. The footer menus can't have dropdowns. */
export function cleanMenuItems(input: unknown, slot: MenuSlot): MenuItem[] {
    if (!Array.isArray(input)) return []
    const out: MenuItem[] = []
    for (const raw of input.slice(0, 40)) {
        if (!raw || typeof raw !== 'object') continue
        const r = raw as Record<string, unknown>
        const label = typeof r.label === 'string' ? r.label.trim().slice(0, 60) : ''
        const url = typeof r.url === 'string' ? safeUrl(r.url.slice(0, 500)) : ''
        if (!label || !url) continue
        out.push({
            id: typeof r.id === 'string' && /^[\w-]{1,64}$/.test(r.id) ? r.id : crypto.randomUUID(),
            label,
            url,
            // A dropdown item needs a top-level item above it
            depth: slot === 'header' && r.depth === 1 && out.length > 0 ? 1 : 0,
            button: slot === 'header' && r.button === true,
            newTab: r.newTab === true
        })
    }
    return out
}

/** The header menu as a tree: top-level links, each with its dropdown links. */
export function menuTree(items: MenuItem[]): (MenuItem & { children: MenuItem[] })[] {
    const tree: (MenuItem & { children: MenuItem[] })[] = []
    for (const item of items) {
        if (item.depth === 1 && tree.length) tree[tree.length - 1]!.children.push(item)
        else tree.push({ ...item, children: [] })
    }
    return tree
}
