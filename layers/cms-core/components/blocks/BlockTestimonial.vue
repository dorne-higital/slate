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
    background: $color-surface;
    border-left: 3px solid $color-primary;
    border-radius: $radius-sm;
    margin: 0;
    padding: $space-5;

    @media (prefers-color-scheme: dark) {
        background: $color-surface-dark;
    }

    &__quote {
        color: $color-text;
        font-size: $font-size-lg;
        font-style: italic;
        margin: 0 0 $space-3;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__author {
        display: flex;
        flex-direction: column;
    }

    &__name {
        color: $color-text;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__role {
        color: $color-text-muted;
        font-size: $font-size-sm;
    }
}
</style>
