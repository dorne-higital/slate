<template>
    <div class="preview-layout">
        <SkipLink />
        <main id="main-content" tabindex="-1">
            <slot />
        </main>
    </div>
</template>

<style lang="scss" scoped>
.preview-layout {
    background: $color-bg;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }
}
</style>
