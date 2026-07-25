<template>
    <div class="theme-view">
        <div class="theme-view__header">
            <h1 class="theme-view__title">Theme</h1>
            <p class="theme-view__intro">
                Customize this site's colors, radius, shadows, typography, and spacing. Anything left unset
                uses the default shown in its field — changes here only affect this site's own pages, not the
                admin dashboard.
            </p>
        </div>

        <p v-if="pending" class="theme-view__status" role="status">Loading…</p>

        <template v-else>
            <div class="theme-presets">
                <span class="theme-presets__label">Start from a preset:</span>
                <button
                    v-for="preset in THEME_PRESETS"
                    :key="preset.name"
                    type="button"
                    class="theme-presets__button"
                    @click="applyPreset(preset)"
                >
                    {{ preset.name }}
                </button>
            </div>

            <div class="theme-editor">
                <form class="theme-form" novalidate @submit.prevent="handleSave">
                    <div class="theme-tabs" role="tablist">
                        <button
                            v-for="tab in TABS"
                            :key="tab"
                            type="button"
                            role="tab"
                            class="theme-tabs__tab"
                            :class="{ 'theme-tabs__tab--active': activeTab === tab }"
                            :aria-selected="activeTab === tab"
                            @click="activeTab = tab"
                        >
                            {{ tab }}
                        </button>
                    </div>

                    <div v-for="group in activeTabGroups" :key="group.name" class="theme-form__group">
                        <p v-if="group.name" class="theme-form__group-title">{{ group.name }}</p>

                        <div v-for="field in group.fields" :key="field.key" class="theme-field">
                            <label class="theme-field__label" :for="`theme-${field.key}`">{{ field.label }}</label>

                            <div class="theme-field__control">
                                <template v-if="field.type === 'color'">
                                    <input
                                        :id="`theme-${field.key}`"
                                        type="color"
                                        class="theme-field__swatch"
                                        :value="valueFor(field)"
                                        @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
                                    >
                                    <input
                                        type="text"
                                        class="theme-field__text"
                                        :value="valueFor(field)"
                                        :aria-label="`${field.label} hex value`"
                                        @change="setValue(field.key, ($event.target as HTMLInputElement).value)"
                                    >
                                </template>
                                <select
                                    v-else-if="field.type === 'font'"
                                    :id="`theme-${field.key}`"
                                    class="theme-field__text theme-field__text--wide"
                                    :value="valueFor(field)"
                                    @change="setValue(field.key, ($event.target as HTMLSelectElement).value)"
                                >
                                    <optgroup label="System fonts">
                                        <option v-for="font in systemFonts" :key="font.stack" :value="font.stack">{{ font.label }}</option>
                                    </optgroup>
                                    <optgroup label="Google Fonts">
                                        <option v-for="font in googleFonts" :key="font.stack" :value="font.stack">{{ font.label }}</option>
                                    </optgroup>
                                </select>
                                <input
                                    v-else
                                    :id="`theme-${field.key}`"
                                    type="text"
                                    class="theme-field__text theme-field__text--wide"
                                    :value="valueFor(field)"
                                    @change="setValue(field.key, ($event.target as HTMLInputElement).value)"
                                >
                                <button
                                    type="button"
                                    class="theme-field__reset"
                                    :disabled="draftTheme[field.key] === undefined"
                                    :aria-label="`Reset ${field.label} to default`"
                                    @click="resetValue(field.key)"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>

                    <p v-if="saveError" role="alert" class="theme-form__error">{{ saveError }}</p>
                    <p v-if="saveStatus" role="status" class="theme-form__status">{{ saveStatus }}</p>

                    <div class="theme-form__buttons">
                        <button type="submit" class="theme-form__submit" :disabled="saving">
                            {{ saving ? 'Saving…' : 'Save theme' }}
                        </button>
                        <button type="button" class="theme-form__reset-all" @click="resetAll">
                            Reset all to defaults
                        </button>
                    </div>
                </form>

                <div class="theme-preview">
                    <p class="theme-preview__title">Live preview</p>
                    <div class="theme-preview__frame">
                        <BlockRenderer :blocks="sampleBlocks" :theme="draftTheme" />
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import type { Block, Site, SiteTheme } from '../../../types'
import { SITE_THEME_FIELDS, type SiteThemeField } from '../../../utils/siteTheme'
import { THEME_PRESETS, type SiteThemePreset } from '../../../utils/siteThemePresets'
import { FONT_OPTIONS, googleFontLinksFor } from '../../../utils/siteFonts'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data, pending } = await useFetch<{ site: Site }>(`/api/sites/${siteId}`)
const site = computed(() => data.value?.site ?? null)

// Only ever holds keys the site actually overrides — an absent key means
// "use the default," both for what's shown (valueFor falls back to
// field.default) and for what gets saved (an empty object round-trips to
// theme: null server-side, see normalizeTheme in the PATCH route).
const draftTheme = reactive<SiteTheme>({})

watch(site, (value) => {
    Object.assign(draftTheme, value?.theme ?? {})
}, { immediate: true })

const systemFonts = FONT_OPTIONS.filter(font => !font.google)
const googleFonts = FONT_OPTIONS.filter(font => font.google)

// So the live preview actually shows a selected Google Font, not just
// its fallback — the same call the public site renderer and the page
// builder canvas make for their own themes.
useHead({ link: () => googleFontLinksFor(draftTheme) })

function applyPreset(preset: SiteThemePreset) {
    resetAll()
    Object.assign(draftTheme, preset.theme)
}

const TABS = ['Brand', 'Buttons', 'Typography', 'Misc'] as const
const activeTab = ref<typeof TABS[number]>('Brand')

// Fields for the active tab only, further split into their subgroups
// (e.g. Typography -> Fonts/Sizes/Weights) so a tab with a lot of fields
// still reads as organized sections rather than one long list.
const activeTabGroups = computed(() => {
    const groups = new Map<string, SiteThemeField[]>()
    for (const field of SITE_THEME_FIELDS) {
        if (field.tab !== activeTab.value) continue
        const name = field.subgroup ?? ''
        if (!groups.has(name)) groups.set(name, [])
        groups.get(name)!.push(field)
    }
    return Array.from(groups, ([name, fields]) => ({ name, fields }))
})

function valueFor(field: SiteThemeField): string {
    return draftTheme[field.key] ?? field.default
}

function setValue(key: keyof SiteTheme, value: string) {
    draftTheme[key] = value
}

function resetValue(key: keyof SiteTheme) {
    Reflect.deleteProperty(draftTheme, key)
}

function resetAll() {
    for (const field of SITE_THEME_FIELDS) {
        Reflect.deleteProperty(draftTheme, field.key)
    }
}

// Real block components with representative sample content — chosen so
// every themeable field shows up somewhere: hero/CTA cover the brand
// colors, testimonial covers text + surface, rich-text covers links, and
// the gallery's empty-state placeholder covers the border color.
const sampleBlocks: Block[] = [
    {
        id: 'theme-preview-hero',
        type: 'hero',
        props: {
            heading: 'Welcome to your site',
            subheading: 'This preview updates instantly as you change colors below.',
            ctaLabel: 'Get started',
            ctaUrl: '#'
        }
    },
    {
        id: 'theme-preview-rich-text',
        type: 'rich-text',
        props: { html: '<p>Body copy uses the text color, and <a href="#">links use their own</a>.</p>' }
    },
    {
        id: 'theme-preview-testimonial',
        type: 'testimonial',
        props: { quote: 'Exactly the look we wanted, in a few minutes.', authorName: 'Jamie Rivera', authorRole: 'Site owner' }
    },
    {
        id: 'theme-preview-cta',
        type: 'cta',
        props: { heading: 'Ready to publish?', body: 'This section shows the accent background and button colors.', buttonLabel: 'Publish', buttonUrl: '#' }
    },
    {
        id: 'theme-preview-gallery',
        type: 'image-gallery',
        props: { images: '' }
    }
]

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
            body: { theme: { ...draftTheme } }
        })
        saveStatus.value = 'Saved.'
    } catch (error) {
        saveError.value = error instanceof Error ? error.message : 'Failed to save theme'
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.theme-view {
    &__header {
        margin-bottom: $space-5;
    }

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
        margin: 0;
        max-width: 40rem;
    }

    &__status {
        color: $color-text-muted;
    }
}

.theme-presets {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    margin-bottom: $space-5;

    &__label {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin-right: $space-1;
    }

    &__button {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: 999px;
        color: $color-text;
        cursor: pointer;
        font-size: $font-size-sm;
        font-weight: 600;
        padding: $space-2 $space-4;

        &:hover {
            border-color: $color-primary;
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}

.theme-editor {
    display: flex;
    gap: $space-6;
}

.theme-form {
    @include card;

    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    gap: $space-5;
    width: 26rem;

    &__group-title {
        @include eyebrow;

        margin: 0 0 $space-2;
    }

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

    &__buttons {
        align-items: center;
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

        &:hover:not(:disabled) {
            background: $color-primary-hover;
        }
    }

    &__reset-all {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: pointer;
        font-size: $font-size-sm;
        padding: $space-2;

        &:hover {
            color: $color-primary;
            text-decoration: underline;
        }
    }
}

.theme-form__group + .theme-form__group {
    border-top: 1px solid $color-border;
    padding-top: $space-5;

    @media (prefers-color-scheme: dark) {
        border-color: $color-border-dark;
    }
}

.theme-tabs {
    border-bottom: 1px solid $color-border;
    display: flex;
    gap: $space-1;
    margin: -#{$space-4} -#{$space-4} 0;
    padding: 0 $space-4;

    @media (prefers-color-scheme: dark) {
        border-color: $color-border-dark;
    }

    &__tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: $color-text-muted;
        cursor: pointer;
        font-size: $font-size-sm;
        font-weight: 600;
        margin-bottom: -1px;
        padding: $space-3 $space-2;

        @include visible-focus-ring;

        &:hover {
            color: $color-text;

            @media (prefers-color-scheme: dark) {
                color: $color-text-dark;
            }
        }

        &--active {
            border-bottom-color: $color-primary;
            color: $color-primary;
        }
    }
}

.theme-field {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    margin-top: $space-3;

    &__label {
        color: $color-text;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__control {
        align-items: center;
        display: flex;
        gap: $space-2;
    }

    &__swatch {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        cursor: pointer;
        flex-shrink: 0;
        height: 2.25rem;
        padding: 2px;
        width: 2.75rem;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__text {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        flex: 1;
        font-family: $font-family-mono;
        font-size: $font-size-sm;
        min-width: 0;
        padding: $space-2 $space-3;

        &--wide {
            width: 100%;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__reset {
        background: none;
        border: none;
        color: $color-text-muted;
        cursor: pointer;
        flex-shrink: 0;
        font-size: $font-size-sm;
        padding: $space-2;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.4;
        }

        &:hover:not(:disabled) {
            color: $color-primary;
            text-decoration: underline;
        }
    }
}

.theme-preview {
    flex: 1;
    min-width: 0;

    &__title {
        @include eyebrow;

        margin: 0 0 $space-3;
    }

    &__frame {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-md;
        padding: $space-6;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
        }
    }
}
</style>
