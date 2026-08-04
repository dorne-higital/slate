<template>
    <div class="layout-view">
        <h1 class="layout-view__title">Layout</h1>
        <p class="layout-view__intro">
            Choose how your site's header and footer look. Each style pulls its links from a menu — set those up under
            <NuxtLink :to="`/sites/${siteId}/menus`">Menus</NuxtLink>.
        </p>

        <Toast v-model="toast" />

        <section class="layout-section">
            <h2 class="layout-section__title">Header style</h2>

            <div class="layout-style-grid">
                <button
                    v-for="style in HEADER_STYLES"
                    :key="style.key"
                    type="button"
                    class="layout-style-card"
                    :class="{ 'layout-style-card--selected': headerStyle === style.key }"
                    @click="headerStyle = style.key"
                >
                    <span class="layout-style-card__label">{{ style.label }}</span>
                    <span class="layout-style-card__description">{{ style.description }}</span>
                </button>
            </div>

            <p class="layout-section__slots">
                Uses
                <template v-for="(slot, index) in currentHeaderStyle.slots" :key="slot">
                    <span v-if="index > 0">, </span>
                    <NuxtLink :to="menuLinkFor(slot)" class="layout-section__slot-link">
                        {{ MENU_SLOT_LABELS[slot] }}{{ hasMenuFor(slot) ? '' : ' (not set up yet)' }}
                    </NuxtLink>
                </template>
            </p>
        </section>

        <section class="layout-section">
            <h2 class="layout-section__title">Footer style</h2>

            <div class="layout-style-grid">
                <button
                    v-for="style in FOOTER_STYLES"
                    :key="style.key"
                    type="button"
                    class="layout-style-card"
                    :class="{ 'layout-style-card--selected': footerStyle === style.key }"
                    @click="footerStyle = style.key"
                >
                    <span class="layout-style-card__label">{{ style.label }}</span>
                    <span class="layout-style-card__description">{{ style.description }}</span>
                </button>
            </div>

            <p class="layout-section__slots">
                Uses
                <template v-for="(slot, index) in currentFooterStyle.slots" :key="slot">
                    <span v-if="index > 0">, </span>
                    <NuxtLink :to="menuLinkFor(slot)" class="layout-section__slot-link">
                        {{ MENU_SLOT_LABELS[slot] }}{{ hasMenuFor(slot) ? '' : ' (not set up yet)' }}
                    </NuxtLink>
                </template>
            </p>
        </section>

        <button type="button" class="layout-view__save" :disabled="saving" @click="handleSave">
            {{ saving ? 'Saving…' : 'Save' }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { Menu, MenuSlot, Site, SiteLayout, ToastMessage } from '../../../types'
import {
    DEFAULT_FOOTER_STYLE,
    DEFAULT_HEADER_STYLE,
    FOOTER_STYLES,
    HEADER_STYLES,
    MENU_SLOT_LABELS,
    footerStyleFor,
    headerStyleFor
} from '../../../utils/siteLayoutStyles'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data: siteData } = await useFetch<{ site: Site }>(`/api/sites/${siteId}`)
const { data: menusData } = await useFetch<{ menus: Menu[] }>('/api/menus', { query: { siteId } })

const site = computed(() => siteData.value?.site ?? null)
const menus = computed(() => menusData.value?.menus ?? [])

const headerStyle = ref(site.value?.layout?.header ?? DEFAULT_HEADER_STYLE)
const footerStyle = ref(site.value?.layout?.footer ?? DEFAULT_FOOTER_STYLE)

watch(site, (value) => {
    if (!value) return
    headerStyle.value = value.layout?.header ?? DEFAULT_HEADER_STYLE
    footerStyle.value = value.layout?.footer ?? DEFAULT_FOOTER_STYLE
}, { immediate: true })

const currentHeaderStyle = computed(() => headerStyleFor(headerStyle.value))
const currentFooterStyle = computed(() => footerStyleFor(footerStyle.value))

function hasMenuFor(slot: MenuSlot) {
    return menus.value.some(menu => menu.slot === slot)
}

function menuLinkFor(slot: MenuSlot) {
    const existing = menus.value.find(menu => menu.slot === slot)
    return existing ? `/sites/${siteId}/menus/${existing.id}` : `/sites/${siteId}/menus`
}

const saving = ref(false)
const toast = ref<ToastMessage | null>(null)

async function handleSave() {
    saving.value = true

    try {
        const layout: SiteLayout = { header: headerStyle.value, footer: footerStyle.value }
        await $fetch(`/api/sites/${siteId}`, { method: 'PATCH', body: { layout } })
        toast.value = { message: 'Saved.', variant: 'success' }
    } catch (error) {
        toast.value = { message: error instanceof Error ? error.message : 'Failed to save layout', variant: 'error' }
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.layout-view {
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

.layout-section {
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

    &__slots {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: $space-3 0 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__slot-link {
        color: $color-primary;
        font-weight: 600;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-dark;
        }
    }
}

.layout-style-grid {
    display: grid;
    gap: $space-4;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
}

.layout-style-card {
    background: $color-surface-raised;
    border: 2px solid $color-border;
    border-radius: $radius-md;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: $space-1;
    padding: $space-4;
    text-align: left;
    transition: border-color $transition-fast;

    &:hover {
        border-color: $color-text-muted;
    }

    &--selected {
        border-color: $color-primary;
    }

    @media (prefers-color-scheme: dark) {
        background: $color-surface-raised-dark;
        border-color: $color-border-dark;

        &:hover {
            border-color: $color-text-muted-dark;
        }

        &--selected {
            border-color: $color-primary-dark;
        }
    }

    &__label {
        color: $color-text;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__description {
        color: $color-text-muted;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}
</style>
