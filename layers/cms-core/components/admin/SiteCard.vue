<template>
    <li class="site-card">
        <div class="site-card__top">
            <p class="site-card__slug">{{ site.slug }}</p>
            <StatusPill :label="statusLabel" :variant="statusVariant" />
        </div>

        <h3 class="site-card__name">{{ site.name }}</h3>

        <p class="site-card__meta">
            {{ pageCount }} {{ pageCount === 1 ? 'page' : 'pages' }}
            &middot;
            {{ memberCount }} {{ memberCount === 1 ? 'member' : 'members' }}
        </p>

        <p class="site-card__updated">Updated {{ formatRelativeTime(site.updated_at) }}</p>

        <NuxtLink :to="`/sites/${site.id}`" class="site-card__open">
            Open site
        </NuxtLink>
    </li>
</template>

<script setup lang="ts">
import type { SiteWithMembers } from '../../types'

const props = defineProps<{
    site: SiteWithMembers & { pages?: Array<{ count: number }> }
}>()

const memberCount = computed(() => props.site.site_members?.length ?? 0)
const pageCount = computed(() => props.site.pages?.[0]?.count ?? 0)

const statusLabel = computed(() => {
    if (props.site.status === 'active') return 'Live'
    if (props.site.status === 'paused') return 'Paused'
    return 'Archived'
})

const statusVariant = computed(() => {
    if (props.site.status === 'active') return 'info' as const
    if (props.site.status === 'paused') return 'outline' as const
    return 'warn' as const
})
</script>

<style lang="scss" scoped>
.site-card {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__top {
        align-items: center;
        display: flex;
        justify-content: space-between;
    }

    &__slug {
        @include eyebrow;

        margin: 0;
    }

    &__name {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__meta {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__updated {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0 0 $space-2;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__open {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        font-weight: 600;
        margin-top: auto;
        padding: $space-3;
        text-align: center;
        text-decoration: none;
        transition: border-color $transition-fast;

        &:hover {
            border-color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
