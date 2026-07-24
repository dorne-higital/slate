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
    color: var(--site-text-primary, #{$color-text});
    line-height: $line-height-base;

    // Site theming is light-mode only (see _site-theme.scss) — dark mode
    // keeps the app's own fixed dark palette regardless of a site's
    // custom colors.
    @media (prefers-color-scheme: dark) {
        color: $color-text-dark;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
        @include heading-font;
    }

    :deep(a) {
        color: var(--site-link, #{$color-primary});

        &:hover {
            color: var(--site-link-hover, #{$color-primary-hover});
        }
    }
}
</style>
