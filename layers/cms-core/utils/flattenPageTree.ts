import type { PageTreeNode } from '../types'

export interface FlatPageRow extends PageTreeNode {
    depth: number
}

/**
 * Walks a page tree into a flat, ordered list suitable for real <table>
 * rows (nesting <tr> inside <tr> isn't valid HTML). A node's children are
 * only included when its id is in `expandedIds`, so collapsing a parent
 * hides its whole subtree.
 */
export function flattenPageTree(nodes: PageTreeNode[], expandedIds: Set<string>, depth = 0): FlatPageRow[] {
    const rows: FlatPageRow[] = []

    for (const node of nodes) {
        rows.push({ ...node, depth })

        if (node.children.length > 0 && expandedIds.has(node.id)) {
            rows.push(...flattenPageTree(node.children, expandedIds, depth + 1))
        }
    }

    return rows
}
