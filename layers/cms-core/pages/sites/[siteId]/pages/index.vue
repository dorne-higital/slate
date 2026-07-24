<template>
    <div class="pages-view">
        <div class="pages-view__header">
            <div>
                <h1 class="pages-view__title">
                    Pages
                    <span class="pages-view__count">{{ pages.length }} {{ pages.length === 1 ? 'page' : 'pages' }}</span>
                </h1>
            </div>

            <div class="pages-view__actions">
                <label class="pages-view__search">
                    <span class="visually-hidden">Search pages</span>
                    <input v-model="search" type="search" placeholder="Search pages…">
                </label>
                <button type="button" class="pages-view__new" @click="showNewPageForm = !showNewPageForm">
                    New Page
                </button>
            </div>
        </div>

        <form v-if="showNewPageForm" class="new-page" novalidate @submit.prevent="handleCreatePage">
            <div class="field">
                <label class="field__label" for="new-page-title">Title</label>
                <input id="new-page-title" v-model="newPage.title" class="field__input" type="text" required>
            </div>

            <div class="field">
                <label class="field__label" for="new-page-slug">Slug</label>
                <input id="new-page-slug" v-model="newPage.slug" class="field__input" type="text">
                <p class="field__hint">
                    Leave blank only if this is a top-level page and should be the site's home page.
                </p>
            </div>

            <div class="field">
                <label class="field__label" for="new-page-parent">Parent page</label>
                <select id="new-page-parent" v-model="newPage.parentId" class="field__input">
                    <option value="">None (top level)</option>
                    <option v-for="row in parentOptions" :key="row.id" :value="row.id">
                        {{ '—'.repeat(row.depth) }} {{ row.title }}
                    </option>
                </select>
            </div>

            <p v-if="createError" role="alert" class="new-page__error">{{ createError }}</p>

            <div class="new-page__buttons">
                <button type="submit" class="new-page__submit" :disabled="creating">
                    {{ creating ? 'Creating…' : 'Create page' }}
                </button>
                <button type="button" class="new-page__cancel" @click="showNewPageForm = false">
                    Cancel
                </button>
            </div>
        </form>

        <p v-if="pending" class="pages-view__status" role="status">Loading pages…</p>
        <p v-else-if="flatRows.length === 0" class="pages-view__status" role="status">
            No pages yet. Select "New Page" to create the first one.
        </p>

        <div v-else class="pages-table-wrap">
            <table class="pages-table">
                <thead>
                    <tr>
                        <th scope="col">Title</th>
                        <th scope="col">Status</th>
                        <th scope="col">SEO title</th>
                        <th scope="col">SEO description</th>
                        <th scope="col">Last edited</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in flatRows" :key="row.id">
                        <td>
                            <div class="pages-table__title-cell" :style="{ paddingLeft: `${row.depth * 1.5}rem` }">
                                <button
                                    v-if="row.children.length"
                                    type="button"
                                    class="pages-table__toggle"
                                    :aria-expanded="expandedIds.has(row.id)"
                                    :aria-label="expandedIds.has(row.id) ? `Collapse ${row.title}` : `Expand ${row.title}`"
                                    @click="toggleExpanded(row.id)"
                                >
                                    {{ expandedIds.has(row.id) ? '▾' : '▸' }}
                                </button>
                                <span v-else class="pages-table__toggle-spacer" aria-hidden="true" />
                                <span class="pages-table__title">{{ row.title }}</span>
                            </div>
                        </td>
                        <td>
                            <StatusPill
                                :label="row.status === 'published' ? 'Published' : 'Draft'"
                                :variant="row.status === 'published' ? 'info' : 'outline'"
                            />
                        </td>
                        <td class="pages-table__truncate">{{ row.seo_title || '—' }}</td>
                        <td class="pages-table__truncate">{{ row.seo_description || '—' }}</td>
                        <td class="pages-table__muted">{{ formatRelativeTime(row.updated_at) }}</td>
                        <td>
                            <div class="pages-table__actions">
                                <button
                                    type="button"
                                    class="pages-table__icon-button"
                                    :aria-label="`Duplicate ${row.title}`"
                                    @click="handleDuplicate(row.id)"
                                >
                                    <IconCopy />
                                </button>
                                <button
                                    type="button"
                                    class="pages-table__icon-button"
                                    :aria-label="`Delete ${row.title}`"
                                    @click="handleDelete(row)"
                                >
                                    <IconTrash />
                                </button>
                                <NuxtLink :to="`/sites/${siteId}/pages/${row.id}`" class="pages-table__edit">
                                    Edit
                                </NuxtLink>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Page, PageTreeNode } from '../../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data, pending, refresh } = await useFetch<{ pages: Page[] }>('/api/pages', {
    query: { siteId }
})

const pages = computed(() => data.value?.pages ?? [])
const search = ref('')

const filteredPages = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return pages.value
    return pages.value.filter(page => page.title.toLowerCase().includes(query))
})

const pageTree = computed(() => buildPageTree(filteredPages.value))
const fullTree = computed(() => buildPageTree(pages.value))

const expandedIds = ref<Set<string>>(new Set())

// Default every parent to expanded the first time it's seen, without
// clobbering a parent the user has since collapsed. Runs on every pageTree
// change (new pages, refresh after mutation), not just once — and always
// reassigns .value with a new Set, since mutating a ref-wrapped Set in
// place doesn't trigger reactivity (Vue only tracks .value reads/writes).
watch(pageTree, (tree) => {
    const next = new Set(expandedIds.value)
    let changed = false

    const collectParents = (nodes: PageTreeNode[]) => {
        for (const node of nodes) {
            if (node.children.length > 0) {
                if (!next.has(node.id)) {
                    next.add(node.id)
                    changed = true
                }
                collectParents(node.children)
            }
        }
    }
    collectParents(tree)

    if (changed) {
        expandedIds.value = next
    }
}, { immediate: true })

function toggleExpanded(id: string) {
    const next = new Set(expandedIds.value)
    if (next.has(id)) {
        next.delete(id)
    } else {
        next.add(id)
    }
    expandedIds.value = next
}

const flatRows = computed(() => flattenPageTree(pageTree.value, expandedIds.value))

// Always fully expanded, independent of the table's own collapse state —
// picking a parent for a new page shouldn't depend on what's expanded.
const parentOptions = computed(() => {
    const allIds = new Set(pages.value.map(page => page.id))
    return flattenPageTree(fullTree.value, allIds)
})

const showNewPageForm = ref(false)
const creating = ref(false)
const createError = ref('')
const newPage = reactive({ title: '', slug: '', parentId: '' })

async function handleCreatePage() {
    creating.value = true
    createError.value = ''

    try {
        await $fetch('/api/pages', {
            method: 'POST',
            body: {
                siteId,
                title: newPage.title,
                slug: newPage.slug,
                parentId: newPage.parentId || null
            }
        })
        newPage.title = ''
        newPage.slug = ''
        newPage.parentId = ''
        showNewPageForm.value = false
        await refresh()
    } catch (error) {
        createError.value = error instanceof Error ? error.message : 'Failed to create page'
    } finally {
        creating.value = false
    }
}

async function handleDuplicate(pageId: string) {
    await $fetch('/api/pages/duplicate', {
        method: 'POST',
        body: { siteId, pageId }
    })
    await refresh()
}

async function handleDelete(page: Page) {
    const hasChildren = pages.value.some(candidate => candidate.parent_id === page.id)
    const message = hasChildren
        ? `Delete "${page.title}" and all of its child pages? This can't be undone.`
        : `Delete "${page.title}"? This can't be undone.`

    // Native confirm is accessible by default and avoids building a
    // focus-trapped modal for one destructive action.
    if (!window.confirm(message)) return

    await $fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
        query: { siteId }
    })
    await refresh()
}
</script>

<style lang="scss" scoped>
.pages-view {
    &__header {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
        margin-bottom: $space-5;
    }

    &__title {
        @include heading-font;

        align-items: baseline;
        color: $color-text;
        display: flex;
        font-size: $font-size-2xl;
        gap: $space-3;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__count {
        background: $color-surface;
        border-radius: 999px;
        color: $color-text-muted;
        font-family: $font-family-base;
        font-size: $font-size-sm;
        font-weight: 400;
        padding: $space-1 $space-3;
    }

    &__actions {
        align-items: center;
        display: flex;
        gap: $space-3;
    }

    &__search input {
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__new {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;

        &:hover {
            background: $color-primary-hover;
        }
    }

    &__status {
        color: $color-text-muted;
    }
}

.pages-table-wrap {
    overflow-x: auto;
}

.pages-table {
    border-collapse: collapse;
    width: 100%;

    th {
        @include eyebrow;

        border-bottom: 1px solid $color-border;
        padding: $space-2 $space-3;
        text-align: left;
        white-space: nowrap;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    td {
        border-bottom: 1px solid $color-border;
        color: $color-text;
        padding: $space-3;
        vertical-align: middle;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    tbody tr:hover {
        background: $color-surface;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
        }
    }

    &__title-cell {
        align-items: center;
        display: flex;
        gap: $space-2;
    }

    &__title {
        @include heading-font;

        font-size: $font-size-base;
    }

    &__toggle,
    &__toggle-spacer {
        flex-shrink: 0;
        width: 1.25rem;
    }

    &__toggle {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: pointer;
    }

    &__truncate {
        @include truncate;

        color: $color-text-muted;
        max-width: 16rem;
    }

    &__muted {
        color: $color-text-muted;
        white-space: nowrap;
    }

    &__actions {
        align-items: center;
        display: flex;
        gap: $space-2;
        white-space: nowrap;
    }

    &__icon-button {
        background: none;
        border: none;
        border-radius: $radius-sm;
        color: $color-text-muted;
        cursor: pointer;
        display: inline-flex;
        padding: $space-1;

        &:hover {
            color: $color-primary;
        }
    }

    &__edit {
        background: $color-primary;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        font-weight: 600;
        padding: $space-2 $space-4;
        text-decoration: none;

        &:hover {
            background: $color-primary-hover;
        }
    }
}

.new-page {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-bottom: $space-5;
    max-width: 24rem;

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        font-size: $font-size-sm;
        margin: 0;
        padding: $space-2 $space-3;
    }

    &__buttons {
        display: flex;
        gap: $space-3;
    }

    &__submit {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }
    }

    &__cancel {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        padding: $space-3 $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;
    }

    &__label {
        color: $color-text;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__input {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
