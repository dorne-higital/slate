export function isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

type PageRow = typeof schema.pages.$inferSelect

/** The page as the editor sees it, including whether the draft differs from what's live. */
export function toEditorPage(page: PageRow) {
    return {
        id: page.id,
        parentId: page.parentId,
        title: page.title,
        path: page.path,
        status: page.status,
        blocks: page.blocks,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        shareImage: page.shareImage,
        noIndex: page.noIndex,
        kind: page.kind,
        project: page.kind === 'project' ? { ...cleanProjectMeta({}), ...(page.project ?? {}) } : null,
        hasUnpublishedChanges: page.status === 'draft' || JSON.stringify(page.blocks) !== JSON.stringify(page.publishedBlocks),
        publishedAt: page.publishedAt?.toISOString() ?? null,
        updatedAt: page.updatedAt.toISOString()
    }
}

export type EditorPage = ReturnType<typeof toEditorPage>
