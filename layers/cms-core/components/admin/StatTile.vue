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

    &__label {
        @include eyebrow;

        margin: 0 0 $space-2;
    }

    &__value {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-xl;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }
}
</style>
