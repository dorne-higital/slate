<template>
    <div class="admin-layout">
        <SkipLink />

        <header class="admin-layout__header">
            <NuxtLink to="/admin" class="admin-layout__brand">Slate CMS</NuxtLink>
            <div class="admin-layout__user">
                <UserMenu />
            </div>
        </header>

        <main id="main-content" class="admin-layout__main" tabindex="-1">
            <slot />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.admin-layout {
    background: $color-bg;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__header {
        align-items: center;
        border-bottom: 1px solid $color-border;
        display: flex;
        justify-content: space-between;
        padding: $space-4 $space-6;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__brand {
        color: $color-text;
        font-family: $font-family-serif;
        font-size: $font-size-lg;
        font-weight: 700;
        text-decoration: none;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__user {
        max-width: 16rem;
    }

    &__main {
        margin: 0 auto;
        max-width: 72rem;
        padding: $space-6;
    }
}
</style>
