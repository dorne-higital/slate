<template>
    <div class="dashboard">
        <h1 class="dashboard__title">Dashboard</h1>

        <div class="dashboard__stats">
            <StatTile label="Pages" :value="stats.pages" />
            <StatTile label="Published" :value="stats.publishedPages" />
            <StatTile label="Draft" :value="stats.draftPages" />
            <StatTile label="Members" :value="stats.members" />
        </div>

        <section class="activity" aria-labelledby="activity-heading">
            <h2 id="activity-heading" class="activity__title">Recent activity</h2>

            <p v-if="pending" class="activity__status" role="status">Loading activity…</p>
            <p v-else-if="activity.length === 0" class="activity__status" role="status">
                Nothing's happened yet — activity shows up here as pages are created, edited, and published.
            </p>

            <ul v-else class="activity__list">
                <li v-for="entry in activity" :key="entry.id" class="activity__item">
                    <span class="activity__dot" :class="`activity__dot--${entry.action}`" aria-hidden="true" />
                    <span class="activity__text">
                        <strong>{{ entry.actor_email ?? 'Someone' }}</strong>
                        {{ verbFor(entry) }}
                        <strong>{{ entry.entity_label ?? entry.entity_type }}</strong>
                    </span>
                    <span class="activity__time">{{ formatRelativeTime(entry.created_at) }}</span>
                </li>
            </ul>
        </section>
    </div>
</template>

<script setup lang="ts">
import type { AuditLogEntry, SiteDashboardStats } from '../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data, pending } = await useFetch<{ stats: SiteDashboardStats, activity: AuditLogEntry[] }>('/api/site-dashboard', {
    query: { siteId }
})

const stats = computed<SiteDashboardStats>(() => data.value?.stats ?? {
    pages: 0,
    publishedPages: 0,
    draftPages: 0,
    members: 0
})
const activity = computed(() => data.value?.activity ?? [])

function verbFor(entry: AuditLogEntry) {
    const noun = entry.entity_type
    if (entry.action === 'insert') return `created ${noun}`
    if (entry.action === 'delete') return `deleted ${noun}`
    return `updated ${noun}`
}
</script>

<style lang="scss" scoped>
.dashboard {
    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: 0 0 $space-5;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__stats {
        display: grid;
        gap: $space-4;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        margin-bottom: $space-6;
    }
}

.activity {
    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0 0 $space-3;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__status {
        color: $color-text-muted;
    }

    &__list {
        display: flex;
        flex-direction: column;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__item {
        align-items: center;
        border-bottom: 1px solid $color-border;
        display: flex;
        gap: $space-3;
        padding: $space-3 0;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__dot {
        border-radius: 999px;
        flex-shrink: 0;
        height: 0.5rem;
        width: 0.5rem;

        &--insert {
            background: $color-success;
        }

        &--update {
            background: $color-warning;
        }

        &--delete {
            background: $color-danger;
        }
    }

    &__text {
        color: $color-text;
        flex: 1;
        min-width: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__time {
        color: $color-text-muted;
        flex-shrink: 0;
        font-size: $font-size-sm;
    }
}
</style>
