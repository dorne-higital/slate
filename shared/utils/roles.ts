export const ROLE_INFO: Record<SiteRole, { name: string, can: string }> = {
    owner: { name: 'Owner', can: 'Everything, including billing, domains and deleting the site' },
    admin: { name: 'Admin', can: 'Everything except billing and deleting the site' },
    editor: { name: 'Editor', can: 'Pages, blog, menus, forms and replies' },
    viewer: { name: 'Viewer', can: 'Can look at everything but not change it' }
}

/** Roles someone with `actor` role may hand out (by invite or by changing a person's role). */
export function assignableRoles(actor: SiteRole): SiteRole[] {
    if (actor === 'owner') return ['owner', 'admin', 'editor', 'viewer']
    if (actor === 'admin') return ['editor', 'viewer']
    return []
}

/** Whether someone with `actor` role may change or remove a person who has `target` role. */
export function canManage(actor: SiteRole, target: SiteRole): boolean {
    return actor === 'owner' || (actor === 'admin' && (target === 'editor' || target === 'viewer'))
}
