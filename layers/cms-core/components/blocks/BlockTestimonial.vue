<template>
    <figure class="block-testimonial">
        <blockquote class="block-testimonial__quote">{{ quote }}</blockquote>
        <figcaption v-if="authorName" class="block-testimonial__author">
            <span class="block-testimonial__name">{{ authorName }}</span>
            <span v-if="authorRole" class="block-testimonial__role">{{ authorRole }}</span>
        </figcaption>
    </figure>
</template>

<script setup lang="ts">
defineProps<{
    quote?: string
    authorName?: string
    authorRole?: string
}>()
</script>

<style lang="scss" scoped>
.block-testimonial {
    background: var(--site-bg-secondary, #{$color-surface});
    border-left: 3px solid var(--site-brand-primary, #{$color-primary});
    border-radius: var(--site-border-radius-sm, #{$radius-sm});
    box-shadow: var(--site-shadow-sm, none);
    margin: 0;
    padding: var(--site-padding-md, #{$space-5});

    // Site theming is light-mode only (see _site-theme.scss) — dark mode
    // keeps the app's own fixed dark palette regardless of a site's
    // custom colors.
    @media (prefers-color-scheme: dark) {
        background: $color-surface-dark;
    }

    &__quote {
        color: var(--site-text-primary, #{$color-text});
        font-family: var(--site-body-font-family, #{$font-family-base});
        font-size: var(--site-h4-size, #{$font-size-lg});
        font-style: italic;
        margin: 0 0 var(--site-padding-sm, #{$space-3});

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__author {
        display: flex;
        flex-direction: column;
    }

    &__name {
        color: var(--site-text-primary, #{$color-text});
        font-family: var(--site-body-font-family, #{$font-family-base});
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__role {
        color: var(--site-text-secondary, #{$color-text-muted});
        font-size: var(--site-eyebrow-size, #{$font-size-sm});
    }
}
</style>
