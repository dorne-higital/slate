<template>
    <aside class="side-panel" aria-label="Block properties">
        <template v-if="modelValue">
            <p class="side-panel__title">{{ blockLabel }} Settings</p>

            <div v-for="field in schema" :key="field.key" class="field">
                <label class="field__label" :for="`field-${field.key}`">{{ field.label }}</label>

                <textarea
                    v-if="field.kind === 'textarea' || field.kind === 'richtext'"
                    :id="`field-${field.key}`"
                    class="field__input"
                    rows="4"
                    :value="stringValue(field.key)"
                    @input="setValue(field.key, ($event.target as HTMLTextAreaElement).value)"
                />

                <ImagePicker
                    v-else-if="field.kind === 'image'"
                    :model-value="stringValue(field.key)"
                    :site-id="siteId"
                    @update:model-value="setValue(field.key, $event)"
                />

                <select
                    v-else-if="field.kind === 'select'"
                    :id="`field-${field.key}`"
                    class="field__input"
                    :value="stringValue(field.key)"
                    @change="setValue(field.key, ($event.target as HTMLSelectElement).value)"
                >
                    <option v-for="option in field.options" :key="option.value" :value="option.value">
                        {{ option.label }}
                    </option>
                </select>

                <input
                    v-else-if="field.kind === 'boolean'"
                    :id="`field-${field.key}`"
                    type="checkbox"
                    :checked="Boolean(rawValue(field.key))"
                    @change="setValue(field.key, ($event.target as HTMLInputElement).checked)"
                >

                <input
                    v-else
                    :id="`field-${field.key}`"
                    class="field__input"
                    :type="inputType(field.kind)"
                    :value="stringValue(field.key)"
                    @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
                >
            </div>
        </template>

        <p v-else class="side-panel__empty">Select a block to edit its properties.</p>
    </aside>
</template>

<script setup lang="ts">
import type { Block, BlockFieldSchema } from '../../types'

const props = defineProps<{
    modelValue: Block | null
    schema: BlockFieldSchema[]
    blockLabel: string
    siteId: string
}>()

const emit = defineEmits<{ 'update:modelValue': [Block] }>()

function rawValue(key: string) {
    return props.modelValue?.props[key]
}

function stringValue(key: string) {
    const value = rawValue(key)
    return value === undefined || value === null ? '' : String(value)
}

function setValue(key: string, value: unknown) {
    if (!props.modelValue) return
    emit('update:modelValue', {
        ...props.modelValue,
        props: { ...props.modelValue.props, [key]: value }
    })
}

function inputType(kind: BlockFieldSchema['kind']) {
    if (kind === 'url') return 'url'
    if (kind === 'number') return 'number'
    return 'text'
}
</script>

<style lang="scss" scoped>
.side-panel {
    @include card;

    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: $space-3;
    width: 18rem;

    &__title {
        @include eyebrow;

        margin: 0;
    }

    &__empty {
        color: $color-text-muted;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
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
