<template>
    <div class="branding-view">
        <h1 class="branding-view__title">Branding</h1>
        <p class="branding-view__intro">Your logo and favicon, used across your site's header, footer, and browser tab.</p>

        <Toast v-model="toast" />

        <div class="branding-grid">
            <div class="branding-field">
                <h2 class="branding-field__label">Logo</h2>
                <p class="branding-field__hint">Shown in your header and footer. Falls back to your site name until one is set.</p>
                <ImagePicker v-model="logoLight" :site-id="siteId" />
            </div>

            <div class="branding-field">
                <h2 class="branding-field__label">Logo (dark background)</h2>
                <p class="branding-field__hint">Optional — for a future dark-background header/footer style. Not used yet.</p>
                <ImagePicker v-model="logoDark" :site-id="siteId" />
            </div>

            <div class="branding-field">
                <h2 class="branding-field__label">Favicon</h2>
                <p class="branding-field__hint">The small icon shown in a browser tab. Square images work best.</p>
                <ImagePicker v-model="favicon" :site-id="siteId" />
            </div>
        </div>

        <button type="button" class="branding-view__save" :disabled="saving" @click="handleSave">
            {{ saving ? 'Saving…' : 'Save' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { Site, SiteBranding, ToastMessage } from '../../../types'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data: siteData } = await useFetch<{ site: Site }>(`/api/sites/${siteId}`)
const site = computed(() => siteData.value?.site ?? null)

const logoLight = ref(site.value?.branding?.logoLight ?? '')
const logoDark = ref(site.value?.branding?.logoDark ?? '')
const favicon = ref(site.value?.branding?.favicon ?? '')

watch(site, (value) => {
    if (!value) return
    logoLight.value = value.branding?.logoLight ?? ''
    logoDark.value = value.branding?.logoDark ?? ''
    favicon.value = value.branding?.favicon ?? ''
}, { immediate: true })

const saving = ref(false)
const toast = ref<ToastMessage | null>(null)

async function handleSave() {
    saving.value = true

    try {
        const branding: SiteBranding = {
            logoLight: logoLight.value || undefined,
            logoDark: logoDark.value || undefined,
            favicon: favicon.value || undefined
        }
        await $fetch(`/api/sites/${siteId}`, { method: 'PATCH', body: { branding } })
        toast.value = { message: 'Saved.', variant: 'success' }
    } catch (error) {
        toast.value = { message: error instanceof Error ? error.message : 'Failed to save branding', variant: 'error' }
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.branding-view {
    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: 0 0 $space-2;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__intro {
        color: $color-text-muted;
        margin: 0 0 $space-6;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__save {
        background: $color-primary;
        border: none;
        border-radius: 999px;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        margin-top: $space-6;
        padding: $space-3 $space-6;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        &:hover:not(:disabled) {
            background: $color-primary-hover;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }
}

.branding-grid {
    display: grid;
    gap: $space-6;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
}

.branding-field {
    &__label {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-base;
        margin: 0 0 $space-1;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0 0 $space-3;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}
</style>
