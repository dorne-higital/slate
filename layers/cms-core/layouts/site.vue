<template>
    <div class="site-layout">
        <SkipLink />

        <p v-if="pending" class="site-layout__status" role="status">Loading site…</p>

        <p v-else-if="error" class="site-layout__status" role="alert">
            {{ error.statusCode === 403 ? "You don't have access to this site." : 'Site not found.' }}
        </p>

        <template v-else-if="site">
            <SiteSidebar
                :site-id="site.id"
                :site-name="site.name"
                :site-slug="site.slug"
                :role-label="roleLabel"
                :is-platform-admin="isPlatformAdmin"
            />
            <main id="main-content" class="site-layout__main" tabindex="-1">
                <slot />
            </main>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { SiteWithMembers } from '../types'

const route = useRoute()
const siteId = computed(() => String(route.params.siteId))

const { data, pending, error } = await useFetch<{ site: SiteWithMembers }>(
    () => `/api/sites/${siteId.value}`
)

const site = computed(() => data.value?.site ?? null)

const { isPlatformAdmin } = await useCurrentAccess()

const roleLabel = computed(() => {
    if (isPlatformAdmin) return 'Platform Admin'
    const user = useSupabaseUser()
    const membership = site.value?.site_members.find(member => member.user_id === user.value?.id)
    if (!membership) return 'Member'
    return membership.role.charAt(0).toUpperCase() + membership.role.slice(1)
})
</script>

<style lang="scss" scoped>
.site-layout {
    background: $color-bg;
    display: flex;
    min-height: 100vh;

    @media (prefers-color-scheme: dark) {
        background: $color-bg-dark;
    }

    &__status {
        color: $color-text-muted;
        padding: $space-6;
    }

    &__main {
        flex: 1;
        padding: $space-6;
    }
}
</style>
