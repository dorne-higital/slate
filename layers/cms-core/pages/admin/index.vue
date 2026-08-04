<template>
    <div class="admin-home">
        <div class="admin-home__header">
            <div>
                <p class="admin-home__eyebrow">Super Admin</p>
                <h1 class="admin-home__title">All Sites</h1>
            </div>

            <div class="admin-home__actions">
                <label class="admin-home__search">
                    <span class="visually-hidden">Search sites</span>
                    <input v-model="search" type="search" placeholder="Search sites…">
                </label>
                <button type="button" class="admin-home__new" @click="showNewSiteForm = !showNewSiteForm">
                    New site
                </button>
            </div>
        </div>

        <div class="admin-home__stats">
            <StatTile label="Sites" :value="sites.length" />
            <StatTile label="Live sites" :value="liveCount" />
            <StatTile label="Pages" :value="totalPages" />
            <StatTile label="Site memberships" :value="totalMemberships" />
        </div>

        <section v-if="pendingSignupRequests.length" class="signup-requests" aria-labelledby="signup-requests-heading">
            <h2 id="signup-requests-heading" class="signup-requests__title">Signup requests</h2>

            <ul class="signup-requests__list">
                <li v-for="req in pendingSignupRequests" :key="req.id" class="signup-requests__item">
                    <div class="signup-requests__info">
                        <p class="signup-requests__name">{{ req.first_name }} {{ req.last_name }}</p>
                        <p class="signup-requests__detail">{{ req.email }}{{ req.phone ? ` · ${req.phone}` : '' }}</p>
                        <p class="signup-requests__detail">"{{ req.site_name }}" &middot; {{ req.plan }} plan</p>
                    </div>

                    <div class="signup-requests__actions">
                        <p v-if="convertErrors[req.id]" role="alert" class="signup-requests__error">{{ convertErrors[req.id] }}</p>
                        <button
                            type="button"
                            class="signup-requests__convert"
                            :disabled="convertingId === req.id"
                            @click="handleConvert(req.id)"
                        >
                            {{ convertingId === req.id ? 'Creating…' : 'Create site & invite' }}
                        </button>
                    </div>
                </li>
            </ul>
        </section>

        <form v-if="showNewSiteForm" class="new-site" novalidate @submit.prevent="handleCreateSite">
            <h2 class="new-site__title">New site</h2>

            <div class="field">
                <label class="field__label" for="new-site-name">Name</label>
                <input id="new-site-name" v-model="newSite.name" class="field__input" type="text" required>
            </div>

            <div class="field">
                <label class="field__label" for="new-site-slug">Slug</label>
                <input id="new-site-slug" v-model="newSite.slug" class="field__input" type="text" required>
            </div>

            <div class="field">
                <label class="field__label" for="new-site-owner">Owner</label>
                <select id="new-site-owner" v-model="newSite.ownerUserId" class="field__input" required>
                    <option value="" disabled>Select a user…</option>
                    <option v-for="user in users" :key="user.id" :value="user.id">
                        {{ user.full_name ? `${user.full_name} (${user.email})` : user.email }}
                    </option>
                </select>
                <p class="field__hint">
                    Only people who've already signed up appear here — inviting someone new isn't built yet.
                </p>
            </div>

            <p v-if="createError" role="alert" class="new-site__error">{{ createError }}</p>

            <div class="new-site__buttons">
                <button type="submit" class="new-site__submit" :disabled="creating">
                    {{ creating ? 'Creating…' : 'Create site' }}
                </button>
                <button type="button" class="new-site__cancel" @click="showNewSiteForm = false">
                    Cancel
                </button>
            </div>
        </form>

        <p v-if="pending" class="admin-home__status" role="status">Loading sites…</p>
        <p v-else-if="filteredSites.length === 0" class="admin-home__status" role="status">No sites match your search.</p>

        <ul v-else class="admin-home__grid">
            <SiteCard v-for="site in filteredSites" :key="site.id" :site="site" />
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { Profile, SignupRequest, SiteWithMembers } from '../../types'

definePageMeta({ layout: 'admin' })

type SiteRow = SiteWithMembers & { pages?: Array<{ count: number }> }

const { data, pending, refresh } = await useFetch<{ sites: SiteRow[] }>('/api/sites')
const { data: usersData } = await useFetch<{ users: Pick<Profile, 'id' | 'email' | 'full_name'>[] }>('/api/admin/users')
const { data: signupRequestsData, refresh: refreshSignupRequests } = await useFetch<{ signupRequests: SignupRequest[] }>('/api/admin/signup-requests')

const pendingSignupRequests = computed(() =>
    (signupRequestsData.value?.signupRequests ?? []).filter(req => req.status === 'new' || req.status === 'contacted')
)

const convertingId = ref<string | null>(null)
const convertErrors = reactive<Record<string, string>>({})

async function handleConvert(id: string) {
    convertingId.value = id
    convertErrors[id] = ''

    try {
        await $fetch(`/api/admin/signup-requests/${id}/convert`, { method: 'POST' })
        await Promise.all([refresh(), refreshSignupRequests()])
    } catch (error) {
        convertErrors[id] = error instanceof Error ? error.message : 'Failed to convert this signup request'
    } finally {
        convertingId.value = null
    }
}

const users = computed(() => usersData.value?.users ?? [])

const sites = computed(() => data.value?.sites ?? [])
const search = ref('')

const filteredSites = computed(() => {
    const query = search.value.trim().toLowerCase()
    if (!query) return sites.value
    return sites.value.filter(site =>
        site.name.toLowerCase().includes(query) || site.slug.toLowerCase().includes(query)
    )
})

const liveCount = computed(() => sites.value.filter(site => site.status === 'active').length)
const totalPages = computed(() => sites.value.reduce((sum, site) => sum + (site.pages?.[0]?.count ?? 0), 0))
const totalMemberships = computed(() => sites.value.reduce((sum, site) => sum + (site.site_members?.length ?? 0), 0))

const showNewSiteForm = ref(false)
const creating = ref(false)
const createError = ref('')
const newSite = reactive({ name: '', slug: '', ownerUserId: '' })

async function handleCreateSite() {
    creating.value = true
    createError.value = ''

    try {
        await $fetch('/api/sites', {
            method: 'POST',
            body: { ...newSite }
        })
        newSite.name = ''
        newSite.slug = ''
        newSite.ownerUserId = ''
        showNewSiteForm.value = false
        await refresh()
    } catch (error) {
        createError.value = error instanceof Error ? error.message : 'Failed to create site'
    } finally {
        creating.value = false
    }
}
</script>

<style lang="scss" scoped>
.admin-home {
    &__header {
        align-items: flex-start;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
        margin-bottom: $space-6;
    }

    &__eyebrow {
        @include eyebrow;

        margin: 0;
    }

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: $space-1 0 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__actions {
        align-items: center;
        display: flex;
        gap: $space-3;
    }

    &__search input {
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__new {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;

        &:hover {
            background: $color-primary-hover;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__stats {
        display: grid;
        gap: $space-4;
        grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
        margin-bottom: $space-6;
    }

    &__status {
        color: $color-text-muted;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__grid {
        display: grid;
        gap: $space-4;
        grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
        list-style: none;
        margin: 0;
        padding: 0;
    }
}

.signup-requests {
    margin-bottom: $space-6;

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0 0 $space-3;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: $space-3;
        list-style: none;
        margin: 0;
        padding: 0;
    }

    &__item {
        @include card;

        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        justify-content: space-between;
    }

    &__name {
        color: $color-text;
        font-weight: 700;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__detail {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__actions {
        align-items: flex-end;
        display: flex;
        flex-direction: column;
        gap: $space-2;
    }

    &__error {
        color: $color-danger;
        font-size: $font-size-sm;
        margin: 0;
        max-width: 20rem;
        text-align: right;

        @media (prefers-color-scheme: dark) {
            color: $color-danger-dark;
        }
    }

    &__convert {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;
        white-space: nowrap;

        &:hover {
            background: $color-primary-hover;
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }
}

.new-site {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin-bottom: $space-6;
    max-width: 24rem;

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        font-size: $font-size-sm;
        margin: 0;
        padding: $space-2 $space-3;
    }

    &__buttons {
        display: flex;
        gap: $space-3;
    }

    &__submit {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__cancel {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        padding: $space-3 $space-4;

        @media (prefers-color-scheme: dark) {
            border: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__label {
        color: $color-text;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__input {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
