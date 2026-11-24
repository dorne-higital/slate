<script setup lang="ts">
const props = defineProps<{ siteId: string }>()
const route = useRoute()
const { me, signOut } = useMe()

interface NavItem { key: string, label: string, icon: string, to?: string }

// Items without `to` are in the design but not built yet; they show as "soon".
const groups: { title: string, items: NavItem[] }[] = [
    { title: '', items: [
        { key: 'overview', label: 'Overview', icon: 'M3 8l6-5 6 5v7H3z', to: '' },
        { key: 'pages', label: 'Pages', icon: 'M4 2h7l3 3v11H4z', to: '/pages' },
        { key: 'blog', label: 'Blog', icon: 'M3 4h12M3 9h12M3 14h7' },
        { key: 'forms', label: 'Forms', icon: 'M2 4h14v10H2zM2 4l7 6 7-6' },
        { key: 'media', label: 'Media', icon: 'M2 3h14v12H2zM2 12l4-4 4 4 2-2 4 4' },
        { key: 'menus', label: 'Menus', icon: 'M3 5h12M3 9h12M3 13h12', to: '/menus' }
    ] },
    { title: 'Design', items: [
        { key: 'theme', label: 'Theme', icon: 'M9 2.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M9 2.5v13', to: '/theme' },
        { key: 'blocks', label: 'Blocks', icon: 'M2 2h6v6H2zM10 2h6v6h-6zM2 10h6v6H2zM10 10h6v6h-6z' }
    ] },
    { title: 'Site', items: [
        { key: 'seo', label: 'Search and sharing', icon: 'M8 3a5 5 0 1 0 0 10a5 5 0 1 0 0-10M12 12l4 4' },
        { key: 'domains', label: 'Domains', icon: 'M9 2.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13M2.5 9h13M9 2.5c-3 3.5-3 9.5 0 13M9 2.5c3 3.5 3 9.5 0 13' },
        { key: 'integrations', label: 'Integrations', icon: 'M7 3v4M11 3v4M5 7h8v3a4 4 0 0 1-8 0zM9 14v2' },
        { key: 'settings', label: 'Settings', icon: 'M9 6.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5M9 2v2M9 14v2M2 9h2M14 9h2M4 4l1.5 1.5M12.5 12.5L14 14M4 14l1.5-1.5M12.5 5.5L14 4' },
        { key: 'billing', label: 'Billing', icon: 'M2 4h14v10H2zM2 8h14' }
    ] }
]

const base = computed(() => `/sites/${props.siteId}`)
const site = computed(() => me.value?.sites.find(s => s.id === props.siteId))
const initials = computed(() => (me.value?.name ?? '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase())

function isActive(item: NavItem) {
    if (item.to === undefined) return false
    const target = base.value + item.to
    return item.to === '' ? route.path === target : route.path.startsWith(target)
}
</script>

<template>
    <aside class="sidebar">
        <NuxtLink to="/" class="logo" aria-label="Slate home">
            <BrandMark :size="19" />
        </NuxtLink>

        <div class="site-switch">
            <span class="site-badge" aria-hidden="true">{{ site?.name?.[0] ?? '·' }}</span>
            <span class="site-text">
                <b>{{ site?.name ?? 'Your site' }}</b>
                <span>{{ site?.customDomain ?? `${site?.slug}` }}</span>
            </span>
        </div>

        <nav aria-label="Site">
            <template v-for="group in groups" :key="group.title">
                <div v-if="group.title" class="grp">{{ group.title }}</div>
                <template v-for="item in group.items" :key="item.key">
                    <NuxtLink
                        v-if="item.to !== undefined"
                        :to="base + item.to"
                        class="nv"
                        :class="{ on: isActive(item) }"
                        :aria-current="isActive(item) ? 'page' : undefined"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path :d="item.icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        <span>{{ item.label }}</span>
                    </NuxtLink>
                    <span v-else class="nv soon" aria-disabled="true">
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path :d="item.icon" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                        <span>{{ item.label }}</span>
                        <small>soon</small>
                    </span>
                </template>
            </template>
        </nav>

        <div class="me">
            <span class="avatar" aria-hidden="true">{{ initials }}</span>
            <span class="me-text">
                <b>{{ me?.name }}</b>
                <button type="button" class="link" @click="signOut">Log out</button>
            </span>
        </div>
    </aside>
</template>

<style scoped>
.sidebar {
    background: var(--mist);
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 100vh;
    padding: 16px 12px;
    position: sticky;
    top: 0;
}

.logo { padding: 6px 12px 16px; text-decoration: none; }

.site-switch {
    align-items: center;
    background: var(--white);
    border-radius: var(--radius-lg);
    box-shadow: 0 0 0 1px #d4d8df;
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    padding: 10px;
}

.site-badge {
    align-items: center;
    background: #2f5d50;
    border-radius: var(--radius);
    color: var(--white);
    display: flex;
    flex: none;
    font-weight: 800;
    height: 34px;
    justify-content: center;
    width: 34px;
}

.site-text { display: flex; flex-direction: column; min-width: 0; }
.site-text b { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.site-text span { color: var(--text-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

nav { display: flex; flex-direction: column; gap: 2px; }
.grp { color: var(--text-muted); font-size: 13px; font-weight: 600; padding: 18px 12px 6px; }

.nv {
    align-items: center;
    border-radius: var(--radius);
    color: var(--quarry);
    display: flex;
    font-size: 15px;
    font-weight: 500;
    gap: 12px;
    min-height: 40px;
    padding: 0 12px;
    text-decoration: none;
}

.nv span { flex: 1; }
.nv:hover { background: #d9dde4; color: var(--quarry); }
.nv.on, .nv.on:hover { background: var(--quarry); color: var(--white); }
.nv.soon { color: #6b7284; cursor: default; }
.nv.soon:hover { background: transparent; }
.nv small { font-size: 12px; font-weight: 600; }

.me { align-items: center; display: flex; gap: 10px; margin-top: auto; padding: 24px 12px 12px; }

.avatar {
    align-items: center;
    background: var(--heather);
    border-radius: 50%;
    color: var(--white);
    display: flex;
    font-size: 13px;
    font-weight: 700;
    height: 32px;
    justify-content: center;
    width: 32px;
}

.me-text { display: flex; flex-direction: column; }
.me-text b { font-size: 14px; }

.link {
    background: none;
    border: 0;
    color: var(--text-muted);
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    padding: 0;
    text-align: left;
    text-decoration: underline;
}
</style>
