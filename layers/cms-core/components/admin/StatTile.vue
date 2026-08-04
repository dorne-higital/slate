<template>
    <div class="stat-tile">
        <p class="stat-tile__label">{{ label }}</p>
        <p class="stat-tile__value">{{ value }}</p>
    </div>
</template>

<script setup lang="ts">
defineProps<{ label: string, value: string | number }>()
</script>

<style lang="scss" scoped>
.stat-tile {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-5;

    &__value {
        @include heading-font;

        color: $color-primary;
        font-size: 2.5rem;
        line-height: 1;
        margin: 0;
        order: -1;

        @media (prefers-color-scheme: dark) {
            color: $color-primary-dark;
        }
    }

    &__label {
        color: $color-text-muted;
        font-size: $font-size-base;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}
</style>
