<template>
    <nav class="site-sidebar" aria-label="Site navigation">
        <NuxtLink :to="`/sites/${siteId}`" class="site-sidebar__brand">Slate.</NuxtLink>

        <NuxtLink v-if="isPlatformAdmin" to="/admin" class="site-sidebar__back">
            &larr; All Sites
        </NuxtLink>

        <div class="site-sidebar__switcher">
            <span class="site-sidebar__site-name">{{ siteName }}</span>
            <span class="site-sidebar__role">{{ roleLabel }}</span>
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
// a {slug}.localhost dev subdomain, or a {slug}.{baseDomain} wildcard
// subdomain) — /preview/{slug} only as a fallback while none of those
// resolve. Note this trades away draft-preview: /preview/{slug} is
// same-origin with this admin app, so a logged-in editor's session
// cookie carries over and RLS lets them see unpublished drafts there;
// the live domain is a different origin, no session cookie is sent, so
// only published content is visible through this link either way once a
// real domain exists.
const { public: { baseDomain } } = useRuntimeConfig()
const currentHost = useRequestURL().host
const fallbackPath = computed(() => `/preview/${props.siteSlug}`)

const siteUrl = computed(() => {
    if (props.customDomain) return `https://${props.customDomain}`
    return buildTenantUrl(currentHost, props.siteSlug, baseDomain, fallbackPath.value)
})

const siteUrlLabel = computed(() => (siteUrl.value === fallbackPath.value ? 'Preview site' : 'View live site'))

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
            { label: 'Menus', to: `/sites/${props.siteId}/menus` },
            { label: 'Layout', to: `/sites/${props.siteId}/layout` },
            { label: 'Blog' },
            { label: 'Forms' },
            { label: 'Uploads' }
        ]
    },
    {
        label: 'Site',
        items: [
            { label: 'Branding', to: `/sites/${props.siteId}/branding` },
            { label: 'Company Info', to: `/sites/${props.siteId}/company-info` },
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
    background: $color-surface-raised;
    border-right: 1px solid $color-border;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100vh;
    overflow-y: auto;
    padding: $space-5 $space-4;
    position: sticky;
    top: 0;
    width: $sidebar-width;

    @media (prefers-color-scheme: dark) {
        background: $color-surface-raised-dark;
        border-color: $color-border-dark;
        border-right: 1px solid $color-border-dark;
    }

    &__brand {
        color: $color-text;
        font-size: 1.375rem;
        font-weight: 800;
        margin-bottom: $space-5;
        padding: 0 $space-2;
        text-decoration: none;

        @include visible-focus-ring;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
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

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__switcher {
        display: flex;
        flex-direction: column;
        margin-bottom: $space-4;
        padding: 0 $space-2;
    }

    &__site-name {
        @include truncate;

        color: $color-text;
        font-size: $font-size-base;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__role {
        color: $color-text-muted;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__preview {
        background: $color-surface-active;
        border-radius: $radius-sm;
        color: $color-primary;
        display: block;
        font-size: $font-size-sm;
        font-weight: 600;
        margin-bottom: $space-6;
        padding: $space-2;
        text-align: center;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
            color: $color-primary-dark;
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
        gap: 2px;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__link {
        align-items: center;
        border-left: 3px solid transparent;
        color: $color-text-muted;
        display: flex;
        font-size: $font-size-base;
        font-weight: 500;
        justify-content: space-between;
        padding: $space-2;
        text-decoration: none;
        transition:
            border-color $transition-fast,
            color $transition-fast;

        @include visible-focus-ring;

        &:hover {
            color: $color-text;
        }

        &--active {
            border-left-color: $color-primary;
            color: $color-primary;
            font-weight: 700;
        }

        &--disabled {
            color: $color-text-subtle;
            cursor: default;

            &:hover {
                color: $color-text-subtle;
            }
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;

            &:hover {
                color: $color-text-dark;
            }

            &--active {
                border-left-color: $color-primary-dark;
                color: $color-primary-dark;
            }

            &--disabled {
                color: $color-text-subtle-dark;

                &:hover {
                    color: $color-text-subtle-dark;
                }
            }
        }
    }

    &__soon {
        color: $color-text-subtle;
        font-size: 0.6875rem;
        text-transform: uppercase;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }

    &__footer {
        border-top: 1px solid $color-border;
        margin-top: auto;
        padding-top: $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            border-top: 1px solid $color-border-dark;
        }
    }
}
</style>
