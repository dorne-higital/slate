<template>
    <div class="settings-view">
        <h1 class="settings-view__title">Settings</h1>

        <p v-if="pending" class="settings-view__status" role="status">Loading…</p>

        <form v-else class="settings-form" novalidate @submit.prevent="handleSave">
            <div class="field">
                <label class="field__label" for="site-name">Name</label>
                <input id="site-name" v-model="name" class="field__input" type="text" required>
            </div>

            <div class="field">
                <label class="field__label" for="site-slug">Slug</label>
                <input id="site-slug" v-model="slug" class="field__input" type="text" required>
                <p class="field__hint">Used in the preview URL: /preview/{{ slug }}/…</p>
            </div>

            <div class="field">
                <label class="field__label" for="site-domain">Custom domain</label>
                <input id="site-domain" v-model="customDomain" class="field__input" type="text" placeholder="www.example.com">
                <p class="field__hint">
                    Once set, point this domain's DNS at where this app is hosted. See the README for the exact
                    records to add.
                </p>
            </div>

            <p v-if="saveError" role="alert" class="settings-form__error">{{ saveError }}</p>
            <p v-if="saveStatus" role="status" class="settings-form__status">{{ saveStatus }}</p>

            <button type="submit" class="settings-form__submit" :disabled="saving">
                {{ saving ? 'Saving…' : 'Save' }}
            </button>
        </form>
    </div>
</template>

<script setup lang="ts">
import type { SiteWithMembers } from '../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data, pending } = await useFetch<{ site: SiteWithMembers }>(`/api/sites/${siteId}`)

const site = computed(() => data.value?.site ?? null)

const name = ref('')
const slug = ref('')
const customDomain = ref('')

watch(site, (value) => {
    if (!value) return
    name.value = value.name
    slug.value = value.slug
    customDomain.value = value.custom_domain ?? ''
}, { immediate: true })

const saving = ref(false)
const saveError = ref('')
const saveStatus = ref('')

async function handleSave() {
    saving.value = true
    saveError.value = ''
    saveStatus.value = ''

    try {
        await $fetch(`/api/sites/${siteId}`, {
            method: 'PATCH',
            body: {
                name: name.value,
                slug: slug.value,
                customDomain: customDomain.value || null
            }
        })
        saveStatus.value = 'Saved.'
    } catch (error) {
        saveError.value = error instanceof Error ? error.message : 'Failed to save settings'
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.settings-view {
    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: 0 0 $space-5;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__status {
        color: $color-text-muted;
    }
}

.settings-form {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-4;
    max-width: 28rem;

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        margin: 0;
        padding: $space-2 $space-3;
    }

    &__status {
        color: $color-text-muted;
        margin: 0;
    }

    &__submit {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-4;
        width: fit-content;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        &:hover:not(:disabled) {
            background: $color-primary-hover;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-1;

    &__label {
        color: $color-text;
        font-size: $font-size-sm;
        font-weight: 600;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;
    }

    &__input {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
