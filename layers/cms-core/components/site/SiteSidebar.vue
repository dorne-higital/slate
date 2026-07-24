<template>
    <nav class="site-sidebar" aria-label="Site navigation">
        <NuxtLink v-if="isPlatformAdmin" to="/admin" class="site-sidebar__back">
            &larr; All Sites
        </NuxtLink>

        <div class="site-sidebar__switcher">
            <span class="site-sidebar__dot" aria-hidden="true" />
            <span class="site-sidebar__switcher-text">
                <span class="site-sidebar__site-name">{{ siteName }}</span>
                <span class="site-sidebar__role">{{ roleLabel }}</span>
            </span>
        </div>

        <a :href="siteUrl" target="_blank" rel="noopener" class="site-sidebar__preview">
            {{ siteUrlLabel }} &nearr;
        </a>

        <div v-for="group in groups" :key="group.label" class="site-sidebar__group">
            <p v-if="group.label" class="site-sidebar__group-label">{{ group.label }}</p>
            <ul class="site-sidebar__list">
                <li v-for="item in group.items" :key="item.label">
                    <NuxtLink
                        v-if="item.to"
                        :to="item.to"
                        class="site-sidebar__link"
                        active-class="site-sidebar__link--active"
                    >
                        {{ item.label }}
                    </NuxtLink>
                    <span v-else class="site-sidebar__link site-sidebar__link--disabled" aria-disabled="true">
                        {{ item.label }}
                        <span class="site-sidebar__soon">Soon</span>
                    </span>
                </li>
            </ul>
        </div>

        <div class="site-sidebar__footer">
            <UserMenu />
        </div>
    </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
    siteId: string
    siteName: string
    siteSlug: string
    customDomain: string | null
    roleLabel: string
    isPlatformAdmin: boolean
}>()

// Links to the real, live domain once the site has one (custom_domain,
// or a {slug}.{baseDomain} wildcard subdomain) — /preview/{slug} only as
// a fallback while neither is configured yet. Note this trades away
// draft-preview: /preview/{slug} is same-origin with this admin app, so
// a logged-in editor's session cookie carries over and RLS lets them see
// unpublished drafts there; the live domain is a different origin, no
// session cookie is sent, so only published content is visible through
// this link either way once a real domain exists.
const { public: { baseDomain } } = useRuntimeConfig()

const siteUrl = computed(() => {
    if (props.customDomain) return `https://${props.customDomain}`
    if (baseDomain) return `https://${props.siteSlug}.${baseDomain}`
    return `/preview/${props.siteSlug}`
})

const siteUrlLabel = computed(() => (props.customDomain || baseDomain ? 'View live site' : 'Preview site'))

const groups = computed(() => [
    {
        label: '',
        items: [
            { label: 'Dashboard', to: `/sites/${props.siteId}` }
        ]
    },
    {
        label: 'Content',
        items: [
            { label: 'Pages', to: `/sites/${props.siteId}/pages` },
            { label: 'Menus' },
            { label: 'Blog' },
            { label: 'Forms' },
            { label: 'Uploads' }
        ]
    },
    {
        label: 'Site',
        items: [
            { label: 'Company Info' },
            { label: 'Components' },
            { label: 'Themes', to: `/sites/${props.siteId}/themes` },
            { label: 'Users' },
            { label: 'Settings', to: `/sites/${props.siteId}/settings` }
        ]
    }
])
</script>

<style lang="scss" scoped>
.site-sidebar {
    background: $color-surface;
    border-right: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    overflow-y: auto;
    padding: $space-4;
    position: sticky;
    top: 0;
    width: $sidebar-width;

    @media (prefers-color-scheme: dark) {
        background: $color-surface-dark;
        border-color: $color-border-dark;
    }

    &__back {
        color: $color-text-muted;
        display: inline-block;
        font-size: $font-size-sm;
        font-weight: 600;
        margin-bottom: $space-4;
        padding: $space-2;
        text-decoration: none;

        @include visible-focus-ring;

        &:hover {
            color: $color-primary;
        }
    }

    &__switcher {
        align-items: center;
        display: flex;
        gap: $space-2;
        margin-bottom: $space-5;
        padding: $space-2;
    }

    &__dot {
        background: $color-primary;
        border-radius: 999px;
        flex-shrink: 0;
        height: 0.5rem;
        width: 0.5rem;
    }

    &__switcher-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    &__site-name {
        @include truncate;
        @include heading-font;

        color: $color-text;
        font-size: $font-size-base;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__role {
        color: $color-text-muted;
        font-size: $font-size-sm;
    }

    &__preview {
        background: $color-surface-active;
        border-radius: $radius-sm;
        color: $color-primary;
        display: block;
        font-size: $font-size-sm;
        font-weight: 600;
        margin-bottom: $space-5;
        padding: $space-2;
        text-align: center;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
        }
    }

    &__group {
        margin-bottom: $space-5;
    }

    &__group-label {
        @include eyebrow;

        margin: 0 0 $space-2;
        padding: 0 $space-2;
    }

    &__list {
        display: flex;
        flex-direction: column;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__link {
        align-items: center;
        border-radius: $radius-sm;
        color: $color-text;
        display: flex;
        font-size: $font-size-base;
        justify-content: space-between;
        padding: $space-2;
        text-decoration: none;
        transition: background $transition-fast;

        @include visible-focus-ring;

        &:hover {
            background: $color-surface-active;
        }

        &--active {
            background: $color-surface-active;
            color: $color-primary;
            font-weight: 600;
        }

        &--disabled {
            color: $color-text-muted;
            cursor: default;

            &:hover {
                background: none;
            }
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;

            &:hover {
                background: $color-surface-active-dark;
            }

            &--active {
                background: $color-surface-active-dark;
            }
        }
    }

    &__soon {
        color: $color-text-muted;
        font-size: 0.6875rem;
        text-transform: uppercase;
    }

    &__footer {
        border-top: 1px solid $color-border;
        margin-top: auto;
        padding-top: $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }
}
</style>
