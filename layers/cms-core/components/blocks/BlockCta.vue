<template>
    <section class="block-cta">
        <h2 class="block-cta__heading">{{ heading }}</h2>
        <p v-if="body" class="block-cta__body">{{ body }}</p>
        <a v-if="buttonLabel && buttonUrl" :href="buttonUrl" class="btn primary">
            {{ buttonLabel }}
        </a>
    </section>
</template>

<script setup lang="ts">
defineProps<{
    heading?: string
    body?: string
    buttonLabel?: string
    buttonUrl?: string
}>()
</script>

<style lang="scss" scoped>
.block-cta {
    align-items: center;
    background: var(--site-brand-accent, #{$color-surface-active});
    border-radius: var(--site-border-radius-lg, #{$radius-md});
    display: flex;
    flex-direction: column;
    gap: var(--site-padding-sm, #{$space-3});
    padding: var(--site-padding-lg, #{$space-6});
    text-align: center;

    // Site theming is light-mode only (see _site-theme.scss) — dark mode
    // keeps the app's own fixed dark palette regardless of a site's
    // custom colors.
    @media (prefers-color-scheme: dark) {
        background: $color-surface-active-dark;
    }

    &__heading {
        color: var(--site-text-primary, #{$color-text});
        font-family: var(--site-heading-font-family, #{$font-family-serif});
        font-size: var(--site-h2-size, #{$font-size-xl});
        font-weight: var(--site-heading-font-weight, 700);
        letter-spacing: -0.01em;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__body {
        color: var(--site-text-secondary, #{$color-text-muted});
        font-family: var(--site-body-font-family, #{$font-family-base});
        font-size: var(--site-body-size, #{$font-size-base});
        margin: 0;
        max-width: 32rem;
    }

    // The button itself is styled by the global .btn.primary class —
    // see assets/styles/_site-buttons.scss.
}
</style>
