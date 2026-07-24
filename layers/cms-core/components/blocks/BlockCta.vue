<template>
    <section class="block-cta">
        <h2 class="block-cta__heading">{{ heading }}</h2>
        <p v-if="body" class="block-cta__body">{{ body }}</p>
        <a v-if="buttonLabel && buttonUrl" :href="buttonUrl" class="block-cta__button">
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
    background: $color-surface-active;
    border-radius: $radius-md;
    display: flex;
    flex-direction: column;
    gap: $space-3;
    padding: $space-6;
    text-align: center;

    @media (prefers-color-scheme: dark) {
        background: $color-surface-active-dark;
    }

    &__heading {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-xl;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__body {
        color: $color-text-muted;
        margin: 0;
        max-width: 32rem;
    }

    &__button {
        background: $color-primary;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        font-weight: 700;
        padding: $space-3 $space-5;
        text-decoration: none;

        &:hover {
            background: $color-primary-hover;
        }
    }
}
</style>
