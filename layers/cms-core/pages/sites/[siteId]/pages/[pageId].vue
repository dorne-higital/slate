<template>
    <div class="builder">
        <div v-if="pending" class="builder__status" role="status">Loading page…</div>

        <template v-else-if="page">
            <div class="builder__header">
                <NuxtLink :to="`/sites/${siteId}/pages`" class="builder__back">&larr; Pages</NuxtLink>

                <div class="builder__field builder__field--name">
                    <label class="builder__field-label" for="page-title">Name</label>
                    <input id="page-title" v-model="title" class="builder__field-input builder__field-input--name" type="text">
                </div>

                <div class="builder__field builder__field--slug">
                    <label class="builder__field-label" for="page-slug">Slug</label>
                    <input id="page-slug" v-model="slug" class="builder__field-input" type="text">
                </div>

                <div class="builder__field">
                    <label class="builder__field-label" for="page-parent">Parent page</label>
                    <select id="page-parent" v-model="parentId" class="builder__field-input">
                        <option value="">— Top level —</option>
                        <option v-for="row in parentOptions" :key="row.id" :value="row.id">
                            {{ '—'.repeat(row.depth) }} {{ row.title }}
                        </option>
                    </select>
                </div>

                <div class="builder__header-actions">
                    <button type="button" class="builder__seo-toggle" @click="seoModalOpen = true">
                        SEO
                    </button>

                    <button type="button" class="builder__save" :disabled="saving" @click="handleSave">
                        {{ saving ? 'Saving…' : 'Save' }}
                    </button>
                </div>
            </div>

            <Modal v-model="seoModalOpen" title="Page SEO">
                <div class="field">
                    <label class="field__label" for="seo-title">SEO title</label>
                    <input id="seo-title" v-model="seoTitle" class="field__input" type="text">
                </div>

                <div class="field">
                    <label class="field__label" for="seo-description">SEO description</label>
                    <textarea id="seo-description" v-model="seoDescription" class="field__input" rows="4" />
                </div>
            </Modal>

            <Toast v-model="toast" />

            <div class="builder__editor">
                <PageBuilderCanvas
                    v-model="blocks"
                    :registry="registry"
                    :selected-block-id="selectedBlockId"
                    :theme="site?.theme"
                    @update:selected-block-id="selectedBlockId = $event"
                />

                <div class="builder__sidebar">
                    <BlockSidePanel
                        :model-value="selectedBlock"
                        :schema="selectedSchema"
                        :block-label="selectedBlockLabel"
                        :site-id="siteId"
                        @update:model-value="handleBlockUpdate"
                    />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Block, ComponentDefinition, Page, Site, ToastMessage } from '../../../../types'
import { googleFontLinksFor } from '../../../../utils/siteFonts'

definePageMeta({ layout: 'builder' })

const route = useRoute()
const siteId = String(route.params.siteId)
const pageId = String(route.params.pageId)

const { data, pending } = await useFetch<{ page: Page }>(`/api/pages/${pageId}`, {
    query: { siteId }
})
const { data: registryData } = await useFetch<{ componentRegistry: ComponentDefinition[] }>('/api/component-registry')
// Only its theme is used here — the canvas renders blocks with this
// site's own colors/type-scale/etc, same as a visitor would see, while
// the rest of this page (toolbar, palette, SEO modal) stays on the admin
// app's own fixed design system.
const { data: siteData } = await useFetch<{ site: Site }>(`/api/sites/${siteId}`)
// The rest of this site's pages, for the "Parent page" choices below —
// not just this one page.
const { data: pagesData } = await useFetch<{ pages: Page[] }>('/api/pages', { query: { siteId } })

// So the canvas actually renders a selected Google Font, not just its
// fallback.
useHead({ link: () => googleFontLinksFor(siteData.value?.site.theme) })

const page = computed(() => data.value?.page ?? null)
const registry = computed(() => registryData.value?.componentRegistry ?? [])
const site = computed(() => siteData.value?.site ?? null)
const allPages = computed(() => pagesData.value?.pages ?? [])

const title = ref(page.value?.title ?? '')
const slug = ref(page.value?.slug ?? '')
const parentId = ref(page.value?.parent_id ?? '')
const seoTitle = ref(page.value?.seo_title ?? '')
const seoDescription = ref(page.value?.seo_description ?? '')
const blocks = ref<Block[]>(page.value?.blocks ?? [])

watch(page, (value) => {
    if (!value) return
    title.value = value.title
    slug.value = value.slug
    parentId.value = value.parent_id ?? ''
    seoTitle.value = value.seo_title ?? ''
    seoDescription.value = value.seo_description ?? ''
    blocks.value = value.blocks
}, { immediate: true })

// A page can't be its own ancestor — exclude it and its whole subtree
// from its own "parent page" choices.
const parentOptions = computed(() => {
    const excluded = new Set<string>()
    const collectDescendants = (id: string) => {
        excluded.add(id)
        for (const candidate of allPages.value) {
            if (candidate.parent_id === id) collectDescendants(candidate.id)
        }
    }
    collectDescendants(pageId)

    const eligible = allPages.value.filter(candidate => !excluded.has(candidate.id))
    return flattenPageTree(buildPageTree(eligible), new Set(eligible.map(candidate => candidate.id)))
})

const selectedBlockId = ref<string | null>(null)
const seoModalOpen = ref(false)
const saving = ref(false)
const toast = ref<ToastMessage | null>(null)

const selectedBlock = computed(() => blocks.value.find(block => block.id === selectedBlockId.value) ?? null)
const selectedBlockDefinition = computed(() => registry.value.find(definition => definition.type === selectedBlock.value?.type))
const selectedSchema = computed(() => selectedBlockDefinition.value?.schema ?? [])
const selectedBlockLabel = computed(() => selectedBlockDefinition.value?.label ?? '')

function handleBlockUpdate(updated: Block) {
    blocks.value = blocks.value.map(block => (block.id === updated.id ? updated : block))
}

async function handleSave() {
    saving.value = true

    try {
        await $fetch(`/api/pages/${pageId}`, {
            method: 'PATCH',
            body: {
                siteId,
                title: title.value,
                slug: slug.value,
                parentId: parentId.value || null,
                seoTitle: seoTitle.value || null,
                seoDescription: seoDescription.value || null,
                blocks: blocks.value
            }
        })
        toast.value = { message: 'Saved.', variant: 'success' }
    } catch (error) {
        toast.value = { message: error instanceof Error ? error.message : 'Failed to save page', variant: 'error' }
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.builder {
    display: flex;
    flex-direction: column;
    height: 100vh;

    &__status {
        color: $color-text-muted;
        padding: $space-5;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__header {
        align-items: flex-end;
        background: $color-surface-raised;
        border-bottom: 1px solid $color-border;
        display: flex;
        flex-shrink: 0;
        flex-wrap: wrap;
        gap: $space-5;
        padding: $space-4 $space-5;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
        }
    }

    &__back {
        color: $color-text-muted;
        flex-shrink: 0;
        font-weight: 600;
        padding-bottom: $space-2;
        text-decoration: none;

        &:hover {
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__field {
        display: flex;
        flex-direction: column;
        gap: $space-1;

        &--name,
        &--slug {
            flex: 1;
            min-width: 12rem;
        }
    }

    &__field-label {
        @include eyebrow;
    }

    &__field-input {
        @include visible-focus-ring;

        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        padding: $space-2 $space-3;
        transition: border-color $transition-fast;

        &:hover {
            border-color: $color-text-muted;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__field-input--name {
        font-size: $font-size-lg;
        font-weight: 700;
    }

    &__header-actions {
        align-items: center;
        display: flex;
        gap: $space-3;
        margin-left: auto;
        padding-bottom: 1px;
    }

    &__seo-toggle {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        font-weight: 600;
        padding: $space-2 $space-4;

        &:hover {
            border-color: $color-primary;
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
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
        font-weight: 700;
        padding: $space-2 $space-5;

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

    &__editor {
        display: flex;
        flex: 1;
        gap: $space-5;
        min-height: 0;
        padding: $space-5;
    }

    &__sidebar {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        gap: $space-4;
        overflow-y: auto;
        width: 18rem;
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-1;

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
        padding: $space-2;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
