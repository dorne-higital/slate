<template>
    <div class="block-renderer" :style="themeStyle">
        <template v-for="block in blocks" :key="block.id">
            <component :is="resolveBlockComponent(block.type)" v-if="resolveBlockComponent(block.type)" v-bind="block.props" />
            <p v-else class="block-renderer__unknown" role="alert">
                Unknown block type "{{ block.type }}" — it may have been removed from the component registry.
            </p>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Block, SiteTheme } from '../types'
import { themeToCssVars } from '../utils/siteTheme'

const props = defineProps<{ blocks: Block[], theme?: SiteTheme | null }>()

// Only the fields a site actually set are emitted here — everything else
// falls through to the :root defaults in assets/styles/_site-theme.scss,
// so an unthemed site (or an unset field on a themed one) needs no
// special-casing anywhere.
const themeStyle = computed(() => themeToCssVars(props.theme))
</script>

<style lang="scss" scoped>
.block-renderer {
    display: flex;
    flex-direction: column;

    &__unknown {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        padding: $space-3;
    }
}
</style>
