<template>
    <div class="builder-layout">
        <SkipLink />
        <slot />
    </div>
</template>

<style lang="scss" scoped>
// No SiteSidebar here, deliberately — the page builder is the one screen
// where every pixel of width goes to the block palette/canvas/inspector
// instead. Its own <div class="builder__header"> (in
// pages/sites/[siteId]/pages/[pageId].vue) stands in for site-level nav
// with just a "Back to pages" link.
.builder-layout {
    background: $color-bg;
    height: 100vh;
    overflow: hidden;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }
}
</style>
