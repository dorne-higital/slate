<template>
    <footer class="site-footer">
        <div class="site-footer__inner">
            <div class="site-footer__top">
                <p class="site-footer__brand">
                    <img v-if="logo" :src="logo" :alt="siteName" class="site-footer__logo">
                    <template v-else>{{ siteName }}</template>
                </p>

                <nav v-if="mainItems.length" class="site-footer__nav" aria-label="Footer">
                    <ul class="site-footer__list">
                        <li v-for="item in mainItems" :key="item.id">
                            <a
                                :href="item.url"
                                :target="item.newTab ? '_blank' : undefined"
                                :rel="item.newTab ? 'noopener' : undefined"
                                class="site-footer__link"
                            >
                                {{ item.label }}
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div class="site-footer__bottom">
                <p class="site-footer__copyright">&copy; {{ currentYear }} {{ siteName }}. All rights reserved.</p>

                <nav v-if="legalItems.length" class="site-footer__legal-nav" aria-label="Legal">
                    <ul class="site-footer__legal-list">
                        <li v-for="item in legalItems" :key="item.id">
                            <a
                                :href="item.url"
                                :target="item.newTab ? '_blank' : undefined"
                                :rel="item.newTab ? 'noopener' : undefined"
                                class="site-footer__link site-footer__link--legal"
                            >
                                {{ item.label }}
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    </footer>
</template>

<script setup lang="ts">
import type { MenuItem } from '../types'

defineProps<{
    siteName: string
    logo?: string
    mainItems: MenuItem[]
    legalItems: MenuItem[]
}>()

// Stamped once when the module loads, not reactively per render — a
// footer copyright year doesn't need to tick over live, and Date.now()-
// style calls are avoided in reactive computed positions elsewhere in
// this codebase for the same "don't re-derive every render" reason.
const currentYear = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.site-footer {
    background: var(--site-bg-primary);
    border-top: 1px solid var(--site-border);

    &__inner {
        margin: 0 auto;
        max-width: 72rem;
        padding: var(--site-padding-lg, #{$space-6}) var(--site-padding-md, #{$space-5});
    }

    &__top {
        align-items: flex-start;
        border-bottom: 1px solid var(--site-border);
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
        padding-bottom: var(--site-padding-md, #{$space-5});
    }

    &__brand {
        align-items: center;
        color: var(--site-text-primary);
        display: flex;
        font-family: var(--site-heading-font-family);
        font-size: 1.125rem;
        font-weight: var(--site-heading-font-weight, 700);
        margin: 0;
    }

    &__logo {
        display: block;
        height: 1.75rem;
        width: auto;
    }

    &__list,
    &__legal-list {
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__link {
        color: var(--site-text-secondary);
        font-size: var(--site-navigation-size, #{$font-size-base});
        font-weight: var(--site-navigation-font-weight, 600);
        text-decoration: none;

        &:hover {
            color: var(--site-link-hover, var(--site-brand-primary));
        }
    }

    &__link--legal {
        font-size: $font-size-sm;
        font-weight: 400;
    }

    &__bottom {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
        padding-top: var(--site-padding-md, #{$space-5});
    }

    &__copyright {
        color: var(--site-text-secondary);
        font-size: $font-size-sm;
        margin: 0;
    }
}
</style>
