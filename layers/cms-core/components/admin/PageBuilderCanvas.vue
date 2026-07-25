<template>
    <div class="canvas">
        <div class="canvas__palette-wrap">
            <p class="canvas__palette-title">Components</p>
            <p class="canvas__palette-hint">Drag onto the canvas, or select to add to the end.</p>

            <draggable
                v-model="paletteItems"
                :group="{ name: 'canvas-blocks', pull: 'clone', put: false }"
                :sort="false"
                :clone="cloneBlockFromDefinition"
                item-key="type"
                class="canvas__palette"
                tag="div"
                aria-label="Block palette"
            >
                <template #item="{ element: definition }">
                    <div class="canvas__palette-item">
                        <button type="button" class="canvas__palette-button" @click="addBlock(definition.type)">
                            {{ definition.label }}
                        </button>
                    </div>
                </template>
            </draggable>
        </div>

        <div class="canvas__body">
            <draggable
                v-model="blocks"
                :group="{ name: 'canvas-blocks', pull: true, put: true }"
                item-key="id"
                handle=".canvas-block__handle"
                class="canvas__list"
                :class="{ 'canvas__list--empty': blocks.length === 0 }"
                tag="div"
            >
                <template #item="{ element: block }">
                    <div
                        class="canvas-block"
                        :class="{ 'canvas-block--selected': block.id === selectedBlockId }"
                        role="button"
                        tabindex="0"
                        :aria-pressed="block.id === selectedBlockId"
                        :aria-label="`Select ${labelFor(block.type)} block`"
                        @click="$emit('update:selectedBlockId', block.id)"
                        @keydown.enter="$emit('update:selectedBlockId', block.id)"
                        @keydown.space.prevent="$emit('update:selectedBlockId', block.id)"
                    >
                        <div class="canvas-block__toolbar">
                            <span class="canvas-block__label">
                                {{ labelFor(block.type) }}{{ block.id === selectedBlockId ? ' — Selected' : '' }}
                            </span>
                            <span class="canvas-block__tools">
                                <button
                                    type="button"
                                    class="canvas-block__handle"
                                    aria-label="Drag to reorder"
                                    @click.stop
                                >
                                    ⠿
                                </button>
                                <button
                                    type="button"
                                    class="canvas-block__remove"
                                    :aria-label="`Remove ${labelFor(block.type)} block`"
                                    @click.stop="removeBlock(block.id)"
                                >
                                    Remove
                                </button>
                            </span>
                        </div>

                        <div class="canvas-block__preview">
                            <BlockRenderer v-if="resolveBlockComponent(block.type)" :blocks="[block]" :theme="theme" />
                            <p v-else class="canvas-block__unknown">
                                Unknown block type "{{ block.type }}"
                            </p>
                        </div>
                    </div>
                </template>

                <template #footer>
                    <p v-if="blocks.length === 0" class="canvas__empty">
                        Drag a component here, or select one from the left, to start building this page.
                    </p>
                </template>
            </draggable>
        </div>
    </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { Block, BlockFieldSchema, ComponentDefinition, SiteTheme } from '../../types'

const props = defineProps<{
    modelValue: Block[]
    registry: ComponentDefinition[]
    selectedBlockId: string | null
    theme?: SiteTheme | null
}>()

const emit = defineEmits<{
    'update:modelValue': [Block[]]
    'update:selectedBlockId': [string | null]
}>()

const blocks = computed<Block[]>({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

// The palette is a clone-only drag source (pull: 'clone', put: false), so
// nothing ever actually needs to be written back — but vuedraggable's
// v-model still needs a settable target to bind to.
const paletteItems = computed<ComponentDefinition[]>({
    get: () => props.registry,
    set: () => {}
})

function labelFor(type: string) {
    return props.registry.find(definition => definition.type === type)?.label ?? type
}

function defaultPropsFor(schema: BlockFieldSchema[]) {
    const defaults: Record<string, unknown> = {}
    for (const field of schema) {
        if (field.default !== undefined) {
            defaults[field.key] = field.default
        } else if (field.kind === 'boolean') {
            defaults[field.key] = false
        } else if (field.kind === 'number') {
            defaults[field.key] = 0
        } else {
            defaults[field.key] = ''
        }
    }
    return defaults
}

function newBlockFor(type: string): Block {
    const definition = props.registry.find(item => item.type === type)
    return { id: crypto.randomUUID(), type, props: defaultPropsFor(definition?.schema ?? []) }
}

// vuedraggable's clone-on-drag hook: the palette's "list" is
// ComponentDefinition objects, never blocks — this is what turns a
// dropped definition into a real Block instance (fresh id + default
// props) at the moment it lands in the canvas.
function cloneBlockFromDefinition(definition: ComponentDefinition): Block {
    return newBlockFor(definition.type)
}

function addBlock(type: string) {
    const block = newBlockFor(type)
    blocks.value = [...blocks.value, block]
    emit('update:selectedBlockId', block.id)
}

function removeBlock(id: string) {
    blocks.value = blocks.value.filter(block => block.id !== id)
    if (props.selectedBlockId === id) {
        emit('update:selectedBlockId', null)
    }
}
</script>

<style lang="scss" scoped>
.canvas {
    display: flex;
    flex: 1;
    gap: $space-5;
    min-width: 0;

    &__palette-wrap {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
        width: 12rem;
    }

    &__palette-title {
        @include eyebrow;

        margin: 0 0 $space-1;
    }

    &__palette-hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0 0 $space-3;
    }

    &__palette {
        display: flex;
        flex-direction: column;
        gap: $space-2;
    }

    &__palette-item {
        cursor: grab;
    }

    &__palette-button {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        padding: $space-3;
        text-align: left;
        width: 100%;

        &:hover {
            border-color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__body {
        flex: 1;
        min-width: 0;
    }

    &__empty {
        @include card;

        color: $color-text-muted;
        text-align: center;
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: $space-4;
        min-height: 6rem;

        &--empty {
            border: 2px dashed $color-border;
            border-radius: $radius-md;

            @media (prefers-color-scheme: dark) {
                border-color: $color-border-dark;
            }
        }
    }
}

.canvas-block {
    @include visible-focus-ring;

    border: 2px solid transparent;
    border-radius: $radius-md;
    cursor: pointer;
    padding: $space-1;
    transition: border-color $transition-fast;

    &:hover {
        border-color: $color-border;
    }

    &--selected {
        border-color: $color-primary;
    }

    @media (prefers-color-scheme: dark) {
        &:hover {
            border-color: $color-border-dark;
        }
    }

    &__toolbar {
        align-items: center;
        display: flex;
        justify-content: space-between;
        padding: $space-1 $space-2;
    }

    &__label {
        @include eyebrow;
    }

    &__tools {
        display: flex;
        gap: $space-2;
    }

    &__handle {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: grab;
    }

    &__remove {
        background: none;
        border: none;
        color: $color-danger;
        cursor: pointer;
        font-size: $font-size-sm;
    }

    &__preview {
        pointer-events: none;
    }

    &__unknown {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        margin: 0;
        padding: $space-3;
    }
}
</style>
