<template>
    <div class="default-layout">
        <SkipLink />
        <main id="main-content" class="default-layout__main" tabindex="-1">
            <slot />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.default-layout {
    background: $color-bg;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__main {
        align-items: center;
        display: flex;
        justify-content: center;
        min-height: 100vh;
    }
}
</style>
