<template>
    <div class="block-renderer">
        <template v-for="block in blocks" :key="block.id">
            <component :is="resolveBlockComponent(block.type)" v-if="resolveBlockComponent(block.type)" v-bind="block.props" />
            <p v-else class="block-renderer__unknown" role="alert">
                Unknown block type "{{ block.type }}" — it may have been removed from the component registry.
            </p>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Block } from '../types'

defineProps<{ blocks: Block[] }>()
</script>

<style lang="scss" scoped>
.block-renderer {
    display: flex;
    flex-direction: column;

    &__unknown {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        padding: $space-3;
    }
}
</style>
