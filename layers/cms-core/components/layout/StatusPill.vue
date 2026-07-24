<template>
    <span class="status-pill" :class="`status-pill--${variant}`">{{ label }}</span>
</template>

<script setup lang="ts">
type Variant = 'info' | 'outline' | 'warn'

const props = defineProps<{ label: string, variant: Variant }>()
const variant = computed(() => props.variant)
</script>

<style lang="scss" scoped>
.status-pill {
    border-radius: 999px;
    display: inline-flex;
    font-size: $font-size-sm;
    font-weight: 600;
    padding: $space-1 $space-3;

    &--info {
        background: $color-success-bg;
        border: 1px solid transparent;
        color: $color-success;
    }

    &--outline {
        background: transparent;
        border: 1px solid $color-primary;
        color: $color-primary;
    }

    &--warn {
        background: $color-danger-bg;
        border: 1px solid transparent;
        color: $color-danger;
    }
}
</style>
