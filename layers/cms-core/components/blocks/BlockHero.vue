<template>
    <section class="block-hero" :style="backgroundStyle">
        <h2 class="block-hero__heading">{{ props.heading }}</h2>
        <p v-if="props.subheading" class="block-hero__subheading">{{ props.subheading }}</p>
        <a v-if="props.ctaLabel && props.ctaUrl" :href="props.ctaUrl" class="btn primary">
            {{ props.ctaLabel }}
        </a>
    </section>
</template>

<script setup lang="ts">
const props = defineProps<{
    heading?: string
    subheading?: string
    image?: string
    ctaLabel?: string
    ctaUrl?: string
}>()

const backgroundStyle = computed(() =>
    props.image ? { backgroundImage: `url(${props.image})` } : {}
)
</script>

<style lang="scss" scoped>
.block-hero {
    background-color: var(--site-bg-secondary, #{$color-surface});
    background-position: center;
    background-size: cover;
    border-radius: var(--site-border-radius-lg, #{$radius-md});
    padding: var(--site-padding-xl, #{$space-8}) var(--site-padding-lg, #{$space-6});
    text-align: center;

    // Site theming is light-mode only (see _site-theme.scss) — dark mode
    // keeps the app's own fixed dark palette regardless of a site's
    // custom colors.
    @media (prefers-color-scheme: dark) {
        background-color: $color-surface-dark;
    }

    &__heading {
        color: var(--site-text-primary, #{$color-text});
        font-family: var(--site-heading-font-family, #{$font-family-serif});
        font-size: var(--site-hero-size, #{$font-size-2xl});
        font-weight: var(--site-heading-font-weight, 700);
        letter-spacing: -0.01em;
        margin: 0 0 var(--site-padding-sm, #{$space-3});
    }

    &__subheading {
        color: var(--site-text-secondary, #{$color-text-muted});
        font-family: var(--site-body-font-family, #{$font-family-base});
        font-size: var(--site-body-size, #{$font-size-lg});
        margin: 0 auto var(--site-padding-md, #{$space-5});
        max-width: 36rem;
    }

    // The CTA button itself is styled by the global .btn.primary class
    // — see assets/styles/_site-buttons.scss.
}
</style>
