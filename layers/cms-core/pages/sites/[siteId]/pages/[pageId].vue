<template>
    <div class="builder">
        <div v-if="pending" class="builder__status" role="status">Loading page…</div>

        <template v-else-if="page">
            <div class="builder__header">
                <NuxtLink :to="`/sites/${siteId}/pages`" class="builder__back">&larr; Pages</NuxtLink>

                <div class="builder__fields">
                    <div class="builder__title-row">
                        <label class="visually-hidden" for="page-title">Page title</label>
                        <input id="page-title" v-model="title" class="builder__title-input" type="text">
                        <StatusPill
                            :label="status === 'published' ? 'Published' : 'Draft'"
                            :variant="status === 'published' ? 'info' : 'outline'"
                        />
                    </div>

                    <label class="visually-hidden" for="page-slug">Page slug</label>
                    <input id="page-slug" v-model="slug" class="builder__slug-input" type="text">
                </div>

                <div class="builder__header-actions">
                    <button type="button" class="builder__seo-toggle" @click="seoModalOpen = true">
                        SEO
                    </button>

                    <button type="button" class="builder__preview-toggle" @click="previewMode = !previewMode">
                        {{ previewMode ? 'Edit' : 'Preview' }}
                    </button>

                    <button type="button" class="builder__save" :disabled="saving" @click="handleSave">
                        {{ saving ? 'Saving…' : 'Save' }}
                    </button>

                    <button type="button" class="builder__publish" :disabled="saving" @click="handleTogglePublish">
                        {{ status === 'published' ? 'Unpublish' : 'Publish' }}
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

            <p v-if="saveError" role="alert" class="builder__error">{{ saveError }}</p>
            <p v-if="saveStatus" role="status" class="builder__status-message">{{ saveStatus }}</p>

            <BlockRenderer v-if="previewMode" :blocks="blocks" />

            <div v-else class="builder__editor">
                <PageBuilderCanvas
                    v-model="blocks"
                    :registry="registry"
                    :selected-block-id="selectedBlockId"
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
import type { Block, ComponentDefinition, Page, PageStatus } from '../../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)
const pageId = String(route.params.pageId)

const { data, pending } = await useFetch<{ page: Page }>(`/api/pages/${pageId}`, {
    query: { siteId }
})
const { data: registryData } = await useFetch<{ componentRegistry: ComponentDefinition[] }>('/api/component-registry')

const page = computed(() => data.value?.page ?? null)
const registry = computed(() => registryData.value?.componentRegistry ?? [])

const title = ref(page.value?.title ?? '')
const slug = ref(page.value?.slug ?? '')
const status = ref<PageStatus>(page.value?.status ?? 'draft')
const seoTitle = ref(page.value?.seo_title ?? '')
const seoDescription = ref(page.value?.seo_description ?? '')
const blocks = ref<Block[]>(page.value?.blocks ?? [])

watch(page, (value) => {
    if (!value) return
    title.value = value.title
    slug.value = value.slug
    status.value = value.status
    seoTitle.value = value.seo_title ?? ''
    seoDescription.value = value.seo_description ?? ''
    blocks.value = value.blocks
}, { immediate: true })

const selectedBlockId = ref<string | null>(null)
const previewMode = ref(false)
const seoModalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')
const saveStatus = ref('')

const selectedBlock = computed(() => blocks.value.find(block => block.id === selectedBlockId.value) ?? null)
const selectedBlockDefinition = computed(() => registry.value.find(definition => definition.type === selectedBlock.value?.type))
const selectedSchema = computed(() => selectedBlockDefinition.value?.schema ?? [])
const selectedBlockLabel = computed(() => selectedBlockDefinition.value?.label ?? '')

function handleBlockUpdate(updated: Block) {
    blocks.value = blocks.value.map(block => (block.id === updated.id ? updated : block))
}

async function handleSave() {
    saving.value = true
    saveError.value = ''
    saveStatus.value = ''

    try {
        await $fetch(`/api/pages/${pageId}`, {
            method: 'PATCH',
            body: {
                siteId,
                title: title.value,
                slug: slug.value,
                seoTitle: seoTitle.value || null,
                seoDescription: seoDescription.value || null,
                blocks: blocks.value
            }
        })
        saveStatus.value = 'Saved.'
    } catch (error) {
        saveError.value = error instanceof Error ? error.message : 'Failed to save page'
    } finally {
        saving.value = false
    }
}

async function handleTogglePublish() {
    const nextStatus: PageStatus = status.value === 'published' ? 'draft' : 'published'

    saving.value = true
    saveError.value = ''
    saveStatus.value = ''

    try {
        await $fetch(`/api/pages/${pageId}`, {
            method: 'PATCH',
            body: { siteId, status: nextStatus }
        })
        status.value = nextStatus
        saveStatus.value = nextStatus === 'published' ? 'Published.' : 'Unpublished.'
    } catch (error) {
        saveError.value = error instanceof Error ? error.message : 'Failed to update status'
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.builder {
    &__status,
    &__status-message {
        color: $color-text-muted;
    }

    &__header {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        margin-bottom: $space-4;
    }

    &__back {
        color: $color-primary;
        flex-shrink: 0;
        font-weight: 600;
        margin-bottom: auto;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__fields {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: $space-1;
        min-width: 12rem;
    }

    &__title-row {
        align-items: center;
        display: flex;
        gap: $space-3;
        justify-content: space-between;
    }

    // A plain borderless input reads as static text, not something you can
    // click into — a visible box (matching .field__input elsewhere in the
    // app) plus a hover state is what signals "editable" before the user
    // ever focuses it.
    &__title-input {
        @include heading-font;
        @include visible-focus-ring;

        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        flex-grow:1;
        font-size: $font-size-xl;
        padding: $space-2 $space-3;
        transition: border-color $transition-fast;

        &:hover {
            border-color: $color-text-muted;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;

            &:hover {
                border-color: $color-text-muted;
            }
        }
    }

    &__slug-input {
        @include visible-focus-ring;

        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text-muted;
        font-size: $font-size-sm;
        padding: $space-1 $space-3;
        transition: border-color $transition-fast;

        &:hover {
            border-color: $color-text-muted;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;

            &:hover {
                border-color: $color-text-muted;
            }
        }
    }

    &__header-actions {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-3;
        max-width: 11rem;
    }

    &__preview-toggle {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        flex: 1;
        padding: $space-2 $space-3;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__save {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        flex: 1;
        padding: $space-2 $space-3;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__publish {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        flex: 1;
        font-weight: 700;
        padding: $space-2 $space-4;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        &:hover:not(:disabled) {
            background: $color-primary-hover;
        }
    }

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        margin: 0 0 $space-4;
        padding: $space-3;
    }

    &__seo-toggle {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        flex: 1;
        padding: $space-2 $space-3;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__editor {
        display: flex;
        gap: $space-5;
    }

    &__sidebar {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        gap: $space-4;
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
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
