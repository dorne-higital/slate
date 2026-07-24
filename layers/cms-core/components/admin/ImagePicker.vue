<template>
    <div class="image-picker">
        <div v-if="modelValue" class="image-picker__preview">
            <img :src="modelValue" alt="" class="image-picker__thumb">
        </div>

        <div class="image-picker__actions">
            <button ref="triggerRef" type="button" class="image-picker__choose" @click="openLibrary">
                {{ modelValue ? 'Change image' : 'Choose image' }}
            </button>
            <button
                v-if="modelValue"
                type="button"
                class="image-picker__clear"
                @click="$emit('update:modelValue', '')"
            >
                Remove
            </button>
        </div>

        <Teleport to="body">
            <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- backdrop click-to-close is a bonus affordance; Escape (below) and the Close button are the real keyboard paths -->
            <div v-if="open" class="media-modal-overlay" @click.self="close">
                <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -- standard WAI-ARIA dialog pattern: role="dialog" + tabindex="-1" + keydown handlers, not a native interactive element -->
                <div
                    ref="dialogRef"
                    class="media-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="media-modal-title"
                    tabindex="-1"
                    @keydown.escape="close"
                    @keydown.tab="handleTrapFocus"
                >
                    <div class="media-modal__header">
                        <h2 id="media-modal-title" class="media-modal__title">Media library</h2>
                        <button type="button" class="media-modal__close" aria-label="Close media library" @click="close">
                            ×
                        </button>
                    </div>

                    <label class="media-modal__upload">
                        <span>{{ uploading ? 'Uploading…' : 'Upload new image' }}</span>
                        <input type="file" accept="image/*" class="visually-hidden" :disabled="uploading" @change="handleUpload">
                    </label>

                    <p v-if="uploadError" role="alert" class="media-modal__error">{{ uploadError }}</p>
                    <p v-if="pending" role="status" class="media-modal__status">Loading…</p>
                    <p v-else-if="items.length === 0" class="media-modal__status">No images uploaded yet.</p>

                    <ul v-else class="media-modal__grid">
                        <li v-for="item in items" :key="item.id" class="media-modal__cell">
                            <button
                                type="button"
                                class="media-modal__item"
                                :aria-label="`Use ${item.filename}`"
                                @click="choose(item.url)"
                            >
                                <img :src="item.url" :alt="item.filename" class="media-modal__item-image">
                            </button>
                            <button
                                type="button"
                                class="media-modal__delete"
                                :aria-label="`Delete ${item.filename}`"
                                @click="handleDelete(item)"
                            >
                                <IconTrash />
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import type { MediaItem } from '../../types'

const props = defineProps<{
    modelValue: string
    siteId: string
}>()

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const open = ref(false)
const items = ref<MediaItem[]>([])
const pending = ref(false)
const uploading = ref(false)
const uploadError = ref('')

const dialogRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)

async function fetchMedia() {
    pending.value = true
    try {
        const { media } = await $fetch<{ media: MediaItem[] }>('/api/media', {
            query: { siteId: props.siteId }
        })
        items.value = media
    } finally {
        pending.value = false
    }
}

function openLibrary() {
    open.value = true
    fetchMedia()
    nextTick(() => dialogRef.value?.focus())
}

function close() {
    open.value = false
    triggerRef.value?.focus()
}

function handleTrapFocus(event: KeyboardEvent) {
    if (!dialogRef.value) return

    const focusables = Array.from(dialogRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
    ))

    const first = focusables.at(0)
    const last = focusables.at(-1)
    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
    }
}

function choose(url: string) {
    emit('update:modelValue', url)
    close()
}

async function handleUpload(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    uploading.value = true
    uploadError.value = ''

    try {
        const formData = new FormData()
        formData.append('file', file)
        const { media } = await $fetch<{ media: MediaItem }>('/api/media', {
            method: 'POST',
            query: { siteId: props.siteId },
            body: formData
        })
        items.value = [media, ...items.value]
    } catch (error) {
        uploadError.value = error instanceof Error ? error.message : 'Failed to upload image'
    } finally {
        uploading.value = false
        input.value = ''
    }
}

async function handleDelete(item: MediaItem) {
    // Native confirm is accessible by default and avoids building a
    // focus-trapped modal on top of a focus-trapped modal.
    if (!window.confirm(`Delete "${item.filename}"? This can't be undone.`)) return

    await $fetch(`/api/media/${item.id}`, {
        method: 'DELETE',
        query: { siteId: props.siteId }
    })
    items.value = items.value.filter(existing => existing.id !== item.id)
}
</script>

<style lang="scss" scoped>
.image-picker {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__preview {
        @include card;

        padding: $space-2;
    }

    &__thumb {
        border-radius: $radius-sm;
        display: block;
        height: auto;
        max-height: 8rem;
        object-fit: cover;
        width: 100%;
    }

    &__actions {
        display: flex;
        gap: $space-2;
    }

    &__choose {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        flex: 1;
        padding: $space-2;

        &:hover {
            border-color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__clear {
        background: none;
        border: none;
        color: $color-danger;
        cursor: pointer;
        font-size: $font-size-sm;
    }
}

.media-modal-overlay {
    align-items: center;
    background: rgb(0 0 0 / 50%);
    display: flex;
    inset: 0;
    justify-content: center;
    padding: $space-5;
    position: fixed;
    z-index: $z-index-modal;
}

.media-modal {
    background: $color-bg;
    border-radius: $radius-lg;
    display: flex;
    flex-direction: column;
    gap: $space-4;
    max-height: 90vh;
    max-width: 40rem;
    overflow-y: auto;
    padding: $space-5;
    width: 100%;

    @include visible-focus-ring;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__header {
        align-items: center;
        display: flex;
        justify-content: space-between;
    }

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__close {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: pointer;
        font-size: $font-size-xl;
        line-height: 1;

        &:hover {
            color: $color-primary;
        }
    }

    &__upload {
        align-items: center;
        background: $color-surface;
        border: 1px dashed $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        display: flex;
        justify-content: center;
        padding: $space-3;

        &:hover {
            border-color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        margin: 0;
        padding: $space-2 $space-3;
    }

    &__status {
        color: $color-text-muted;
        margin: 0;
    }

    &__grid {
        display: grid;
        gap: $space-3;
        grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__cell {
        position: relative;
    }

    &__item {
        aspect-ratio: 1;
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        cursor: pointer;
        overflow: hidden;
        padding: 0;
        width: 100%;

        @include visible-focus-ring;

        &:hover {
            border-color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
        }
    }

    &__item-image {
        height: 100%;
        object-fit: cover;
        width: 100%;
    }

    &__delete {
        background: $color-bg;
        border: 1px solid $color-border;
        border-radius: 999px;
        color: $color-danger;
        cursor: pointer;
        display: flex;
        padding: $space-1;
        position: absolute;
        right: $space-1;
        top: $space-1;

        @media (prefers-color-scheme: dark) {
            background: $color-bg-dark;
            border-color: $color-border-dark;
        }
    }
}
</style>
