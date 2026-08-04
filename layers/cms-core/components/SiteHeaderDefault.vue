<template>
    <header class="site-header">
        <div class="site-header__inner">
            <a href="/" class="site-header__brand">
                <img v-if="logo" :src="logo" :alt="siteName" class="site-header__logo">
                <template v-else>{{ siteName }}</template>
            </a>

            <nav v-if="items.length" class="site-header__nav" aria-label="Main">
                <ul class="site-header__list">
                    <li v-for="item in items" :key="item.id" class="site-header__item">
                        <a
                            :href="item.url"
                            :target="item.newTab ? '_blank' : undefined"
                            :rel="item.newTab ? 'noopener' : undefined"
                            class="site-header__link"
                        >
                            {{ item.label }}
                        </a>

                        <ul v-if="item.children.length" class="site-header__submenu">
                            <li v-for="child in item.children" :key="child.id">
                                <a
                                    :href="child.url"
                                    :target="child.newTab ? '_blank' : undefined"
                                    :rel="child.newTab ? 'noopener' : undefined"
                                    class="site-header__link"
                                >
                                    {{ child.label }}
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>
        </div>
    </header>
</template>

<script setup lang="ts">
import type { MenuItem } from '../types'

defineProps<{
    siteName: string
    logo?: string
    items: MenuItem[]
}>()
</script>

<style lang="scss" scoped>
.site-header {
    background: var(--site-bg-secondary);
    border-bottom: 1px solid var(--site-border);

    &__inner {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
        margin: 0 auto;
        max-width: 72rem;
        padding: $space-4 var(--site-padding-md, #{$space-5});
    }

    &__brand {
        align-items: center;
        color: var(--site-text-primary);
        display: flex;
        font-family: var(--site-heading-font-family);
        font-size: 1.25rem;
        font-weight: var(--site-heading-font-weight, 700);
        text-decoration: none;
    }

    &__logo {
        display: block;
        height: 2.25rem;
        width: auto;
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: $space-5;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__item {
        position: relative;

        &:hover .site-header__submenu,
        &:focus-within .site-header__submenu {
            display: flex;
        }
    }

    &__link {
        color: var(--site-text-primary);
        font-size: var(--site-navigation-size, #{$font-size-base});
        font-weight: var(--site-navigation-font-weight, 600);
        text-decoration: none;

        &:hover {
            color: var(--site-link-hover, var(--site-brand-primary));
        }
    }

    &__submenu {
        background: var(--site-bg-secondary);
        border: 1px solid var(--site-border);
        border-radius: var(--site-border-radius-sm, #{$radius-sm});
        box-shadow: var(--site-shadow-sm);
        display: none;
        flex-direction: column;
        gap: $space-2;
        left: 0;
        list-style: none;
        margin: 0;
        min-width: 10rem;
        padding: $space-3;
        position: absolute;
        top: 100%;
        z-index: 10;
    }
}
</style>
