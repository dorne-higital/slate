<template>
    <span class="brand-mark" role="img" :aria-label="label">{{ initial }}</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ initial?: string, label?: string }>(), {
    initial: 'S',
    label: 'Slate CMS'
})
</script>

<style lang="scss" scoped>
.brand-mark {
    color: $color-text;
    font-family: $font-family-serif;
    font-size: 9rem;
    font-weight: 700;
    line-height: 1;
    text-shadow:
        -6px -4px 0 rgb(212 175 55 / 85%),
        6px -2px 0 rgb(31 111 139 / 75%),
        4px 6px 0 rgb(168 40 90 / 75%);
    user-select: none;

    @media (prefers-color-scheme: dark) {
        color: $color-text-dark;
    }
}
</style>
