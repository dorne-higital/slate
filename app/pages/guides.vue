<template>
    <div class="guides">
        <section class="guides__hero">
            <p class="guides__eyebrow">Guides</p>
            <h1 class="guides__title">Learn how to build with Slate</h1>
            <p class="guides__subtitle">
                Short, practical walkthroughs for setting up your site, building pages, and getting ready to launch.
                New guides are added regularly as Slate grows.
            </p>
        </section>

        <section class="guides__category">
            <h2 class="guides__category-title">Getting started</h2>

            <div class="guides__grid">
                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Creating your first site</span>
                    <p class="guides__card-description">
                        Set up a new site, choose a starting point, and get oriented in the dashboard.
                    </p>
                </div>

                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Inviting your team</span>
                    <p class="guides__card-description">
                        Add teammates to a site and understand what each role can see and edit.
                    </p>
                </div>

                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Understanding your dashboard</span>
                    <p class="guides__card-description">
                        A tour of where pages, settings, and site details live once you're signed in.
                    </p>
                </div>
            </div>
        </section>

        <section class="guides__category">
            <h2 class="guides__category-title">Building pages</h2>

            <div class="guides__grid">
                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Using the page builder</span>
                    <p class="guides__card-description">
                        Add, arrange, and edit sections to put a page together from scratch.
                    </p>
                </div>

                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Customizing your site's theme</span>
                    <p class="guides__card-description">
                        Adjust colors, fonts, and layout presets so your site matches your brand.
                    </p>
                </div>

                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Publishing and drafts</span>
                    <p class="guides__card-description">
                        Work on changes privately as a draft, then publish them live when ready.
                    </p>
                </div>
            </div>
        </section>

        <section class="guides__category">
            <h2 class="guides__category-title">Going live</h2>

            <div class="guides__grid">
                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Setting up a custom domain</span>
                    <p class="guides__card-description">
                        Connect a domain you own so your site is reachable at its own address.
                    </p>
                </div>

                <div class="guides__card">
                    <span class="guides__card-badge">Coming soon</span>
                    <span class="guides__card-title">Preparing your site for launch</span>
                    <p class="guides__card-description">
                        A pre-launch checklist covering pages, settings, and domain configuration.
                    </p>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'marketing', public: true })
</script>

<style lang="scss" scoped>
.guides {
    margin: 0 auto;
    max-width: 72rem;
    padding: $space-7 $space-6 $space-8;

    &__hero {
        margin: 0 auto $space-8;
        max-width: 36rem;
        text-align: center;
    }

    &__eyebrow {
        @include eyebrow;

        margin: 0;
    }

    &__title {
        @include heading-font;

        font-size: $font-size-2xl;
        margin: $space-2 0;
    }

    &__subtitle {
        color: $color-text-muted;
        margin: 0;
    }

    &__category {
        margin-bottom: $space-8;
    }

    &__category:last-child {
        margin-bottom: 0;
    }

    &__category-title {
        @include heading-font;

        font-size: $font-size-lg;
        margin: 0 0 $space-5;
    }

    &__grid {
        display: grid;
        gap: $space-5;
        grid-template-columns: repeat(1, minmax(0, 1fr));

        @media (width >= 800px) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    &__card {
        @include card;

        color: $color-text-muted;
        display: flex;
        flex-direction: column;
        opacity: 0.75;
    }

    &__card-badge {
        @include eyebrow;

        background: $color-surface-active;
        border-radius: $radius-sm;
        margin: 0 0 $space-3;
        padding: $space-1 $space-2;
        width: fit-content;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
        }
    }

    &__card-title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-base;
        margin: 0 0 $space-2;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__card-description {
        font-size: $font-size-sm;
        margin: 0;
    }
}
</style>
