<script setup lang="ts">
const { me, signOut } = useMe()
// Tickets waiting on Slate, for the badge
const { data: waiting } = useAsyncData('admin-support-waiting', () => $fetch<unknown[]>('/api/admin/support', { query: { status: 'open' } }).then(r => r.length).catch(() => 0), { server: false, lazy: true })
</script>

<template>
    <header class="top">
        <NuxtLink to="/" aria-label="Slate home" class="home-link"><BrandMark :size="22" /></NuxtLink>
        <span class="tag">Platform admin</span>
        <nav aria-label="Admin" class="nav">
            <NuxtLink to="/admin" class="nav-link" exact-active-class="on">Dashboard</NuxtLink>
            <NuxtLink to="/admin/support" class="nav-link" active-class="on">Support<span v-if="waiting" class="badge">{{ waiting }}</span></NuxtLink>
        </nav>
        <span class="spacer" />
        <span class="who">{{ me?.name }}</span>
        <button type="button" class="btn btn-ghost btn-sm" @click="signOut">Log out</button>
    </header>
</template>

<style scoped>
.top { align-items: center; background: var(--white); border-bottom: 1px solid var(--line); display: flex; flex-wrap: wrap; gap: 14px; padding: 12px 24px; }
.home-link { text-decoration: none; }
.tag { background: var(--lichen); border-radius: 999px; color: var(--quarry); font-size: 12px; font-weight: 700; padding: 3px 10px; }
.nav { display: flex; gap: 4px; margin-left: 12px; }
.nav-link { align-items: center; border-radius: var(--radius); color: var(--text-body); display: inline-flex; font-size: 14px; font-weight: 600; gap: 6px; padding: 7px 12px; text-decoration: none; }
.nav-link:hover { background: var(--mist); }
.nav-link.on { background: var(--mist); color: var(--quarry); }
.badge { background: var(--danger); border-radius: 999px; color: var(--white); font-size: 11px; font-weight: 800; min-width: 18px; padding: 1px 6px; text-align: center; }
.spacer { flex: 1; }
.who { color: var(--text-muted); font-size: 14px; }
</style>
