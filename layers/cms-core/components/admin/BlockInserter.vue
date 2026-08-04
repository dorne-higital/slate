<template>
    <div ref="rootEl" class="inserter" role="menu" aria-label="Add a block">
        <button
            v-for="definition in registry"
            :key="definition.type"
            type="button"
            role="menuitem"
            class="inserter__item"
            @click="$emit('select', definition.type)"
        >
            {{ definition.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { ComponentDefinition } from '../../types'

defineProps<{
    registry: ComponentDefinition[]
}>()

const emit = defineEmits<{
    close: []
    select: [type: string]
}>()

const rootEl = ref<HTMLElement | null>(null)

function handleOutsideClick(event: MouseEvent) {
    if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
        emit('close')
    }
}

// Bound in onMounted, not immediately: Vue mounts this asynchronously
// (nextTick) after the "+" click that opened it has already finished
// bubbling to document, so that same click can never reach this listener
// and instantly close what it just opened.
onMounted(() => {
    document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
    document.removeEventListener('click', handleOutsideClick)
})
</script>

<style lang="scss" scoped>
.inserter {
    @include card;

    left: 50%;
    max-height: 16rem;
    overflow-y: auto;
    padding: $space-2;
    position: absolute;
    top: 100%;
    transform: translateX(-50%);
    width: 14rem;
    z-index: $z-index-modal;

    &__item {
        background: none;
        border: none;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        display: block;
        padding: $space-2 $space-3;
        text-align: left;
        width: 100%;

        &:hover {
            background: $color-surface;
            color: $color-primary;
        }

        @include visible-focus-ring;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;

            &:hover {
                background: $color-surface-dark;
            }
        }
    }
}
</style>
