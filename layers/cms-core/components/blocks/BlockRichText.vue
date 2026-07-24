<template>
    <!-- eslint-disable-next-line vue/no-v-html -- html is user-authored block content, sanitized with DOMPurify just above -->
    <div class="block-rich-text" v-html="sanitizedHtml" />
</template>

<script setup lang="ts">
import DOMPurify from 'isomorphic-dompurify'

const props = defineProps<{ html?: string }>()

const sanitizedHtml = computed(() => (props.html ? DOMPurify.sanitize(props.html) : ''))
</script>

<style lang="scss" scoped>
.block-rich-text {
    color: $color-text;
    line-height: $line-height-base;

    @media (prefers-color-scheme: dark) {
        color: $color-text-dark;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
        @include heading-font;
    }

    :deep(a) {
        color: $color-primary;
    }
}
</style>
