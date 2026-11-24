<script setup lang="ts">
const route = useRoute()
const siteId = computed(() => String(route.params.siteId))
</script>

<template>
    <div class="cms">
        <CmsSidebar :site-id="siteId" />
        <main class="cms-main">
            <slot />
        </main>
    </div>
</template>

<style scoped>
.cms { display: grid; grid-template-columns: 248px minmax(0, 1fr); min-height: 100vh; }
.cms-main { display: flex; flex-direction: column; gap: 24px; min-width: 0; padding: 28px 40px 48px; }

@media (max-width: 860px) {
    .cms { grid-template-columns: minmax(0, 1fr); }
    .cms :deep(.sidebar) { min-height: 0; position: static; }
    .cms-main { padding: 24px 16px 40px; }
}
</style>
