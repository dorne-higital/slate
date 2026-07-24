<template>
    <section class="block-hero" :style="backgroundStyle">
        <h2 class="block-hero__heading">{{ props.heading }}</h2>
        <p v-if="props.subheading" class="block-hero__subheading">{{ props.subheading }}</p>
        <a v-if="props.ctaLabel && props.ctaUrl" :href="props.ctaUrl" class="block-hero__cta">
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
    background-color: $color-surface;
    background-position: center;
    background-size: cover;
    border-radius: $radius-md;
    padding: $space-8 $space-6;
    text-align: center;

    @media (prefers-color-scheme: dark) {
        background-color: $color-surface-dark;
    }

    &__heading {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: 0 0 $space-3;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__subheading {
        color: $color-text-muted;
        font-size: $font-size-lg;
        margin: 0 auto $space-5;
        max-width: 36rem;
    }

    &__cta {
        background: $color-primary;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        display: inline-block;
        font-weight: 700;
        padding: $space-3 $space-5;
        text-decoration: none;

        &:hover {
            background: $color-primary-hover;
        }
    }
}
</style>
