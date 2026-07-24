import type { Page, PageTreeNode } from '../types'

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

    return roots
}
