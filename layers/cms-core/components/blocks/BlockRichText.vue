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
    font-family: var(--site-body-font-family, #{$font-family-base});
    font-size: var(--site-body-size, #{$font-size-base});
    line-height: $line-height-base;

    // Site theming is light-mode only (see _site-theme.scss) — dark mode
    // keeps the app's own fixed dark palette regardless of a site's
    // custom colors.
    @media (prefers-color-scheme: dark) {
        color: $color-text-dark;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
        color: var(--site-text-primary, #{$color-text});
        font-family: var(--site-heading-font-family, #{$font-family-serif});
        font-weight: var(--site-heading-font-weight, 700);
        letter-spacing: -0.01em;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    :deep(h1) {
        font-size: var(--site-h1-size, #{$font-size-2xl});
    }

    :deep(h2) {
        font-size: var(--site-h2-size, #{$font-size-xl});
    }

    :deep(h3) {
        font-size: var(--site-h3-size, #{$font-size-lg});
    }

    :deep(h4),
    :deep(h5),
    :deep(h6) {
        font-size: var(--site-h4-size, #{$font-size-base});
    }

    :deep(a) {
        color: var(--site-link, #{$color-primary});

        &:hover {
            color: var(--site-link-hover, #{$color-primary-hover});
        }
    }

    :deep(blockquote) {
        border-left: 3px solid var(--site-border-strong, #{$color-border});
        color: var(--site-text-secondary, #{$color-text-muted});
        font-style: italic;
        margin: 0;
        padding-left: var(--site-padding-md, #{$space-5});
    }

    :deep(code) {
        background: var(--site-bg-secondary, #{$color-surface});
        border-radius: var(--site-border-radius-sm, #{$radius-sm});
        padding: 0.15em 0.4em;
    }
}
</style>
