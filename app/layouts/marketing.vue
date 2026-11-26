<template>
    <div class="mk-page">
        <a href="#main" class="skip">Skip to content</a>
        <MkHeader />
        <main id="main">
            <slot />
        </main>
        <MkFooter />
    </div>
</template>

<style scoped>
.mk-page { background: var(--paper); color: var(--text); min-height: 100vh; }
.skip { background: var(--quarry); color: var(--white); left: 16px; padding: 10px 16px; position: absolute; top: -60px; z-index: 100; }
.skip:focus { top: 12px; }
</style>
