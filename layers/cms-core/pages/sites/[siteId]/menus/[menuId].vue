<template>
    <div class="menu-editor">
        <p v-if="pending" class="menu-editor__status" role="status">Loading menu…</p>

        <template v-else-if="menu">
            <div class="menu-editor__header">
                <NuxtLink :to="`/sites/${siteId}/menus`" class="menu-editor__back">&larr; Menus</NuxtLink>

                <div class="menu-editor__field">
                    <label class="visually-hidden" for="menu-name">Menu name</label>
                    <input id="menu-name" v-model="name" class="menu-editor__name-input" type="text">
                </div>

                <button type="button" class="menu-editor__save" :disabled="saving" @click="handleSave">
                    {{ saving ? 'Saving…' : 'Save' }}
                </button>
            </div>

            <Toast v-model="toast" />

            <div class="menu-editor__toolbar">
                <button type="button" class="menu-editor__add" @click="addLink">
                    + Add link
                </button>

                <div class="menu-editor__add-page">
                    <button type="button" class="menu-editor__add" @click="addPageOpen = !addPageOpen">
                        + Add page
                    </button>

                    <BlockInserter
                        v-if="addPageOpen"
                        :registry="pageOptions"
                        @close="addPageOpen = false"
                        @select="addPage"
                    />
                </div>
            </div>

            <p v-if="items.length === 0" class="menu-editor__empty">
                No links yet. Select "+ Add link" or "+ Add page" to add the first one.
            </p>

            <MenuItemEditor v-else v-model="items" />
        </template>
    </div>
</template>

<script setup lang="ts">
import type { ComponentDefinition, Menu, MenuItem, Page, ToastMessage } from '../../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)
const menuId = String(route.params.menuId)

const { data, pending } = await useFetch<{ menu: Menu }>(`/api/menus/${menuId}`, {
    query: { siteId }
})
const { data: pagesData } = await useFetch<{ pages: Page[] }>('/api/pages', { query: { siteId } })

const menu = computed(() => data.value?.menu ?? null)
const allPages = computed(() => pagesData.value?.pages ?? [])

const name = ref(menu.value?.name ?? '')
const items = ref<MenuItem[]>(menu.value?.items ?? [])

watch(menu, (value) => {
    if (!value) return
    name.value = value.name
    items.value = value.items
}, { immediate: true })

const saving = ref(false)
const toast = ref<ToastMessage | null>(null)

function newLink(): MenuItem {
    return { id: crypto.randomUUID(), label: '', url: '', newTab: false, children: [] }
}

function addLink() {
    items.value = [...items.value, newLink()]
}

// A page's full URL is its own slug prefixed by every ancestor's slug —
// nesting is expressed via parent_id (see buildPageTree.ts), not stored
// as a precomputed path anywhere, so it's walked here.
function pathFor(page: Page): string {
    const segments: string[] = []
    let current: Page | undefined = page

    while (current) {
        if (current.slug) segments.unshift(current.slug)
        current = current.parent_id ? allPages.value.find(candidate => candidate.id === current!.parent_id) : undefined
    }

    return `/${segments.join('/')}`
}

// BlockInserter (from the page builder) is a generic "pick one of these
// labelled options" popover — reused here instead of building a second,
// near-identical menu component, with each site page standing in for a
// registry entry (its resolved path as the "type" it reports back).
const pageOptions = computed<ComponentDefinition[]>(() =>
    allPages.value.map(page => ({
        type: pathFor(page),
        label: page.title,
        description: '',
        icon: '',
        schema: [],
        created_at: ''
    }))
)

const addPageOpen = ref(false)

function addPage(path: string) {
    const page = allPages.value.find(candidate => pathFor(candidate) === path)
    items.value = [...items.value, { id: crypto.randomUUID(), label: page?.title ?? path, url: path, newTab: false, children: [] }]
    addPageOpen.value = false
}

async function handleSave() {
    saving.value = true

    try {
        await $fetch(`/api/menus/${menuId}`, {
            method: 'PATCH',
            body: { siteId, name: name.value, items: items.value }
        })
        toast.value = { message: 'Saved.', variant: 'success' }
    } catch (error) {
        toast.value = { message: error instanceof Error ? error.message : 'Failed to save menu', variant: 'error' }
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.menu-editor {
    &__status {
        color: $color-text-muted;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__header {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        margin-bottom: $space-5;
    }

    &__back {
        color: $color-text-muted;
        flex-shrink: 0;
        font-weight: 600;
        text-decoration: none;

        &:hover {
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__field {
        flex: 1;
        min-width: 12rem;
    }

    &__name-input {
        @include heading-font;
        @include visible-focus-ring;

        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        font-size: $font-size-xl;
        padding: $space-2 $space-3;
        transition: border-color $transition-fast;
        width: 100%;

        &:hover {
            border-color: $color-text-muted;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__save {
        background: $color-primary;
        border: none;
        border-radius: 999px;
        color: $color-primary-contrast;
        cursor: pointer;
        flex-shrink: 0;
        font-weight: 700;
        padding: $space-3 $space-5;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        &:hover:not(:disabled) {
            background: $color-primary-hover;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__toolbar {
        display: flex;
        gap: $space-5;
        margin-bottom: $space-5;
    }

    &__add-page {
        position: relative;
    }

    &__add {
        background: none;
        border: none;
        color: $color-text;
        cursor: pointer;
        font-weight: 600;

        &:hover {
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__empty {
        @include card;

        color: $color-text-muted;
        text-align: center;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}
</style>
