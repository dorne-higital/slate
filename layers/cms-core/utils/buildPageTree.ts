import type { Page, PageTreeNode } from '../types'

/** A root page with this slug is the site's home page — see server/api/public/site-page.get.ts. */
function isHomePage(node: PageTreeNode): boolean {
    return node.slug === '' || node.slug === '/'
}

export function buildPageTree(pages: Page[]): PageTreeNode[] {
    const nodesById = new Map<string, PageTreeNode>(
        pages.map(page => [page.id, { ...page, children: [] }])
    )
    const roots: PageTreeNode[] = []

    for (const node of nodesById.values()) {
        if (node.parent_id && nodesById.has(node.parent_id)) {
            nodesById.get(node.parent_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    }

    // The home page is the site's front door — always worth seeing first,
    // regardless of where its title happens to fall alphabetically (the
    // API's own ordering, which the rest of this order otherwise
    // preserves as-is).
    roots.sort((a, b) => Number(isHomePage(b)) - Number(isHomePage(a)))

    return roots
}
