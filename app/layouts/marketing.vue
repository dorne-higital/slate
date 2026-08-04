<template>
    <div class="marketing">
        <SkipLink />

        <header class="marketing__header">
            <NuxtLink to="/" class="marketing__brand">Slate.</NuxtLink>

            <nav class="marketing__nav" aria-label="Main">
                <NuxtLink to="/#features" class="marketing__link">Features</NuxtLink>
                <NuxtLink to="/#demo" class="marketing__link">Product</NuxtLink>
                <NuxtLink to="/#pricing" class="marketing__link">Pricing</NuxtLink>
            </nav>

            <div class="marketing__actions">
                <NuxtLink v-if="!user" to="/login" class="marketing__ghost">Log in</NuxtLink>
                <NuxtLink :to="ctaTo" class="marketing__cta">{{ ctaLabel }}</NuxtLink>
            </div>
        </header>

        <main id="main-content" tabindex="-1">
            <slot />
        </main>

        <footer class="marketing__footer">
            <div class="marketing__footer-top">
                <div class="marketing__footer-brand">
                    <span class="marketing__footer-name">Slate.</span>
                    <p class="marketing__footer-tagline">A calm admin panel for pages, media and forms — no code required.</p>
                </div>

                <div class="marketing__footer-columns">
                    <div class="marketing__footer-column">
                        <span class="marketing__footer-heading">Product</span>
                        <NuxtLink to="/#features">Features</NuxtLink>
                        <NuxtLink to="/#demo">Page builder</NuxtLink>
                        <NuxtLink to="/#pricing">Pricing</NuxtLink>
                    </div>

                    <div class="marketing__footer-column">
                        <span class="marketing__footer-heading">Company</span>
                        <NuxtLink to="/about">About</NuxtLink>
                        <span class="marketing__footer-placeholder">Blog</span>
                        <NuxtLink to="/contact">Contact</NuxtLink>
                    </div>

                    <div class="marketing__footer-column">
                        <span class="marketing__footer-heading">Legal</span>
                        <span class="marketing__footer-placeholder">Privacy</span>
                        <span class="marketing__footer-placeholder">Terms</span>
                    </div>
                </div>
            </div>

            <p class="marketing__footer-copyright">&copy; {{ year }} Slate CMS. All rights reserved.</p>
        </footer>
    </div>
</template>

<script setup lang="ts">
// Quicksand/Baloo 2 are loaded globally (see layers/cms-core/nuxt.config.ts
// app.head.link) — this layout doesn't need its own <link> tags for them.
const user = useSupabaseUser()
const year = new Date().getFullYear()

const ctaLabel = computed(() => (user.value ? 'Dashboard' : 'Get started'))
const ctaTo = ref('/register')

if (user.value) {
    const { isPlatformAdmin, siteIds } = await useCurrentAccess()
    ctaTo.value = isPlatformAdmin ? '/admin' : (siteIds[0] ? `/sites/${siteIds[0]}` : '/login')
}
</script>

<style lang="scss" scoped>
.marketing {
    background: $color-bg;
    display: flex;
    flex-direction: column;
    font-family: $font-quicksand;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__header {
        align-items: center;
        backdrop-filter: blur(8px);
        background: color-mix(in oklch, $color-bg 88%, transparent);
        border-bottom: 1px solid $color-border;
        display: flex;
        gap: $space-lg;
        justify-content: space-between;
        margin: 0 auto;
        max-width: $container-xl;
        padding: $space-md $space-lg;
        position: sticky;
        top: 0;
        width: 100%;
        z-index: $z-index-sidebar;

        @media (prefers-color-scheme: dark) {
            background: color-mix(in oklch, $color-bg-dark 88%, transparent);
            border-color: $color-border-dark;
        }
    }

    &__brand {
        color: $color-text;
        font-family: $font-baloo;
        font-size: 1.5rem;
        font-weight: 800;
        text-decoration: none;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__nav {
        align-items: center;
        display: flex;
        gap: $space-lg;
    }

    &__link {
        color: $color-text-muted;
        font-size: $text-small;
        font-weight: 600;
        text-decoration: none;
        transition: color $transition-base;

        &:hover {
            color: $color-text;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;

            &:hover {
                color: $color-text-dark;
            }
        }
    }

    &__actions {
        align-items: center;
        display: flex;
        flex-shrink: 0;
        gap: $space-sm;
    }

    &__ghost {
        border-radius: $radius-pill;
        color: $color-text;
        font-size: $text-small;
        font-weight: 600;
        padding: 0.5rem $space-md;
        text-decoration: none;
        transition: background $transition-base;

        &:hover {
            background: $color-surface;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;

            &:hover {
                background: $color-surface-dark;
            }
        }
    }

    &__cta {
        background: $color-primary;
        border-radius: $radius-pill;
        color: $color-primary-contrast;
        font-size: $text-small;
        font-weight: 600;
        padding: 0.5rem $space-md;
        text-decoration: none;
        transition:
            box-shadow $transition-base,
            transform $transition-base;

        &:hover {
            box-shadow: $shadow-md;
            transform: translateY(-2px);
        }

        &:active {
            transform: scale(0.96);
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;

            &:hover {
                box-shadow: $shadow-md-dark;
            }
        }
    }

    &__footer {
        border-top: 1px solid $color-border;
        padding: $space-xl $space-lg;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__footer-top {
        display: flex;
        flex-wrap: wrap;
        gap: $space-xl;
        justify-content: space-between;
        margin: 0 auto;
        max-width: $container-xl;
    }

    &__footer-brand {
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        max-width: 260px;
    }

    &__footer-name {
        font-family: $font-baloo;
        font-size: 1.25rem;
        font-weight: 800;
    }

    &__footer-tagline {
        color: $color-text-muted;
        font-size: $text-small;
        line-height: $leading-normal;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__footer-columns {
        display: flex;
        flex-wrap: wrap;
        gap: $space-2xl;
    }

    &__footer-column {
        display: flex;
        flex-direction: column;
        gap: $space-sm;

        a,
        .marketing__footer-placeholder {
            color: $color-text-muted;
            font-size: $text-small;
            text-decoration: none;

            @media (prefers-color-scheme: dark) {
                color: $color-text-muted-dark;
            }
        }

        a:hover {
            color: $color-primary;
        }
    }

    &__footer-heading {
        color: $color-text-subtle;
        font-size: $text-eyebrow;
        font-weight: 700;
        letter-spacing: $tracking-wide;
        text-transform: uppercase;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }

    &__footer-copyright {
        border-top: 1px solid $color-border;
        color: $color-text-subtle;
        font-size: $text-micro;
        margin: $space-lg auto 0;
        max-width: $container-xl;
        padding-top: $space-md;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-subtle-dark;
        }
    }
}
</style>
