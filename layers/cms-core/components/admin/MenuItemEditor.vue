<template>
    <draggable
        v-model="items"
        item-key="id"
        handle=".menu-item__handle"
        class="menu-item-list"
        tag="div"
    >
        <template #item="{ element: item }">
            <div class="menu-item">
                <div class="menu-item__row">
                    <button type="button" class="menu-item__handle" aria-label="Drag to reorder">
                        ⠿
                    </button>

                    <label class="visually-hidden" :for="`${item.id}-label`">Link label</label>
                    <input
                        :id="`${item.id}-label`"
                        class="menu-item__input"
                        type="text"
                        placeholder="Label"
                        :value="item.label"
                        @input="updateField(item.id, 'label', ($event.target as HTMLInputElement).value)"
                    >

                    <label class="visually-hidden" :for="`${item.id}-url`">Link URL</label>
                    <input
                        :id="`${item.id}-url`"
                        class="menu-item__input"
                        type="text"
                        placeholder="/path or https://…"
                        :value="item.url"
                        @input="updateField(item.id, 'url', ($event.target as HTMLInputElement).value)"
                    >

                    <label class="menu-item__new-tab">
                        <input
                            type="checkbox"
                            :checked="item.newTab"
                            @change="updateField(item.id, 'newTab', ($event.target as HTMLInputElement).checked)"
                        >
                        New tab
                    </label>

                    <button type="button" class="menu-item__child" @click="addChild(item.id)">
                        + Child
                    </button>

                    <button
                        type="button"
                        class="menu-item__remove"
                        :aria-label="`Remove ${item.label || 'link'}`"
                        @click="removeItem(item.id)"
                    >
                        <IconTrash />
                    </button>
                </div>

                <MenuItemEditor
                    v-if="item.children.length"
                    :model-value="item.children"
                    class="menu-item__children"
                    @update:model-value="setChildren(item.id, $event)"
                />
            </div>
        </template>
    </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import type { MenuItem } from '../../types'

const props = defineProps<{
    modelValue: MenuItem[]
}>()

const emit = defineEmits<{ 'update:modelValue': [MenuItem[]] }>()

const items = computed<MenuItem[]>({
    get: () => props.modelValue,
    set: value => emit('update:modelValue', value)
})

function updateField(id: string, key: 'label' | 'url' | 'newTab', value: string | boolean) {
    items.value = items.value.map(item => (item.id === id ? { ...item, [key]: value } : item))
}

function addChild(id: string) {
    const child: MenuItem = { id: crypto.randomUUID(), label: '', url: '', newTab: false, children: [] }
    items.value = items.value.map(item => (item.id === id ? { ...item, children: [...item.children, child] } : item))
}

function setChildren(id: string, children: MenuItem[]) {
    items.value = items.value.map(item => (item.id === id ? { ...item, children } : item))
}

function removeItem(id: string) {
    items.value = items.value.filter(item => item.id !== id)
}
</script>

<style lang="scss" scoped>
.menu-item-list {
    display: flex;
    flex-direction: column;
    gap: $space-3;
}

.menu-item {
    &__row {
        align-items: center;
        display: flex;
        gap: $space-3;
    }

    &__handle {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: grab;
        flex-shrink: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__input {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        flex: 1;
        min-width: 0;
        padding: $space-2 $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__new-tab {
        align-items: center;
        color: $color-text-muted;
        display: flex;
        flex-shrink: 0;
        font-size: $font-size-sm;
        gap: $space-1;
        white-space: nowrap;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__child {
        background: none;
        border: none;
        color: $color-primary;
        cursor: pointer;
        flex-shrink: 0;
        font-size: $font-size-sm;
        font-weight: 600;
        white-space: nowrap;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-dark;
        }
    }

    &__remove {
        background: none;
        border: none;
        color: $color-danger;
        cursor: pointer;
        display: inline-flex;
        flex-shrink: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-danger-dark;
        }
    }

    &__children {
        margin: $space-3 0 0 $space-6;
    }
}
</style>
