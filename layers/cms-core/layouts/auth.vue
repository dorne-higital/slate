<template>
    <div class="auth-layout">
        <SkipLink />
        <main id="main-content" class="auth-layout__main" tabindex="-1">
            <slot />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.auth-layout {
    background: $color-bg;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__main {
        display: flex;
        min-height: 100vh;
    }
}
</style>
