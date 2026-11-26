<script setup lang="ts">
// The small header for pages that are public before launch (help, privacy, terms): no links to unreleased pages.
</script>

<template>
    <header class="plain-top">
        <NuxtLink to="/" aria-label="Slate home" class="home"><BrandMark /></NuxtLink>
        <nav aria-label="Help and legal" class="links">
            <NuxtLink to="/help">Help</NuxtLink>
            <NuxtLink to="/privacy">Privacy</NuxtLink>
            <NuxtLink to="/terms">Terms</NuxtLink>
        </nav>
    </header>
</template>

<style scoped>
.plain-top { align-items: center; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; margin: 0 auto; max-width: 1200px; padding: 18px 16px; }
.home { text-decoration: none; }
.links { display: flex; gap: 18px; }
.links a { color: var(--text-body); font-weight: 600; text-decoration: none; }
.links a.router-link-active { color: var(--quarry); text-decoration: underline; }
</style>
