<template>
    <div class="block-gallery">
        <div v-for="(url, index) in urls" :key="`${index}-${url}`" class="block-gallery__tile">
            <img v-if="url" :src="url" alt="" class="block-gallery__image">
            <span v-else class="block-gallery__placeholder">{{ String(index + 1).padStart(2, '0') }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ images?: string }>()

const urls = computed(() => {
    const lines = (props.images ?? '').split('\n').map(line => line.trim()).filter(Boolean)
    return lines.length > 0 ? lines : ['', '', '']
})
</script>

<style lang="scss" scoped>
.block-gallery {
    display: grid;
    gap: var(--site-padding-sm, #{$space-4});
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));

    &__tile {
        align-items: center;
        aspect-ratio: 4 / 3;
        background: var(--site-bg-secondary, #{$color-surface});
        border-radius: var(--site-border-radius-sm, #{$radius-sm});
        box-shadow: var(--site-shadow-sm, none);
        display: flex;
        justify-content: center;
        overflow: hidden;

        // Site theming is light-mode only (see _site-theme.scss) — dark
        // mode keeps the app's own fixed dark palette regardless of a
        // site's custom colors.
        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
        }
    }

    &__image {
        height: 100%;
        object-fit: cover;
        width: 100%;
    }

    &__placeholder {
        align-items: center;
        background-image: repeating-linear-gradient(
            45deg,
            var(--site-border, #{$color-border}),
            var(--site-border, #{$color-border}) 2px,
            transparent 2px,
            transparent 10px
        );
        color: var(--site-text-secondary, #{$color-text-muted});
        display: flex;
        font-family: var(--site-body-font-family, #{$font-family-base});
        font-size: var(--site-eyebrow-size, #{$font-size-sm});
        height: 100%;
        justify-content: center;
        width: 100%;

        @media (prefers-color-scheme: dark) {
            background-image: repeating-linear-gradient(
                45deg,
                $color-border-dark,
                $color-border-dark 2px,
                transparent 2px,
                transparent 10px
            );
        }
    }
}
</style>
