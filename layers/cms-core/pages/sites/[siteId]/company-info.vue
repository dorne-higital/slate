<template>
    <div class="company-info-view">
        <h1 class="company-info-view__title">Company Info</h1>
        <p class="company-info-view__intro">Your address, opening hours, and social links.</p>

        <Toast v-model="toast" />

        <div class="tabs" role="tablist">
            <button
                v-for="tab in TABS"
                :key="tab.key"
                type="button"
                role="tab"
                class="tabs__tab"
                :class="{ 'tabs__tab--active': activeTab === tab.key }"
                :aria-selected="activeTab === tab.key"
                @click="activeTab = tab.key"
            >
                {{ tab.label }}
            </button>
        </div>

        <section v-show="activeTab === 'address'" class="tab-panel" aria-label="Address">
            <div class="field-grid">
                <div class="field">
                    <label class="field__label" for="address-business-name">Business name</label>
                    <input id="address-business-name" v-model="address.businessName" class="field__input" type="text">
                </div>

                <div class="field field--wide">
                    <label class="field__label" for="address-line1">Address line 1</label>
                    <input id="address-line1" v-model="address.line1" class="field__input" type="text" placeholder="123 Example Street">
                </div>

                <div class="field field--wide">
                    <label class="field__label" for="address-line2">Address line 2</label>
                    <input id="address-line2" v-model="address.line2" class="field__input" type="text" placeholder="Optional">
                </div>

                <div class="field">
                    <label class="field__label" for="address-town">Town</label>
                    <input id="address-town" v-model="address.town" class="field__input" type="text">
                </div>

                <div class="field">
                    <label class="field__label" for="address-city">City</label>
                    <input id="address-city" v-model="address.city" class="field__input" type="text">
                </div>

                <div class="field">
                    <label class="field__label" for="address-postcode">Postcode</label>
                    <input id="address-postcode" v-model="address.postcode" class="field__input" type="text">
                </div>

                <div class="field">
                    <label class="field__label" for="address-email">Email</label>
                    <input id="address-email" v-model="address.email" class="field__input" type="email" placeholder="hello@example.com">
                </div>

                <div class="field">
                    <label class="field__label" for="address-phone">Contact number</label>
                    <input id="address-phone" v-model="address.phone" class="field__input" type="tel" placeholder="+44 7123 456789">
                </div>
            </div>
        </section>

        <section v-show="activeTab === 'hours'" class="tab-panel" aria-label="Opening hours">
            <div class="hours-grid">
                <div v-for="day in DAYS_OF_WEEK" :key="day" class="hours-row">
                    <span class="hours-row__day">{{ DAY_LABELS[day] }}</span>

                    <label class="hours-row__closed">
                        <input v-model="openingHours[day].closed" type="checkbox">
                        Closed
                    </label>

                    <template v-if="!openingHours[day].closed">
                        <label class="visually-hidden" :for="`hours-${day}-open`">{{ DAY_LABELS[day] }} opening time</label>
                        <input :id="`hours-${day}-open`" v-model="openingHours[day].open" class="field__input" type="time">

                        <span class="hours-row__to">to</span>

                        <label class="visually-hidden" :for="`hours-${day}-close`">{{ DAY_LABELS[day] }} closing time</label>
                        <input :id="`hours-${day}-close`" v-model="openingHours[day].close" class="field__input" type="time">
                    </template>
                    <span v-else class="hours-row__closed-label">Closed all day</span>
                </div>
            </div>
        </section>

        <section v-show="activeTab === 'socials'" class="tab-panel" aria-label="Social links">
            <div v-if="socials.length" class="socials-list">
                <div v-for="social in socials" :key="social.id" class="socials-row">
                    <span class="socials-row__platform">{{ socialPlatformLabel(social.platform) }}</span>
                    <span class="socials-row__value">{{ social.url }}</span>

                    <button type="button" class="socials-row__edit" :aria-label="`Edit ${socialPlatformLabel(social.platform)}`" @click="openEditSocial(social)">
                        <IconPencil />
                    </button>

                    <button type="button" class="socials-row__remove" :aria-label="`Remove ${socialPlatformLabel(social.platform)}`" @click="removeSocial(social.id)">
                        <IconTrash />
                    </button>
                </div>
            </div>
            <p v-else class="socials-list__empty">No social links yet.</p>

            <button type="button" class="company-info-view__add" @click="openAddSocial">
                + Add social link
            </button>
        </section>

        <button type="button" class="company-info-view__save" :disabled="saving" @click="handleSave">
            {{ saving ? 'Saving…' : 'Save' }}
        </button>

        <Modal v-model="socialModalOpen" :title="editingSocialId ? 'Edit social link' : 'Add social link'">
            <div class="field">
                <label class="field__label" for="social-platform">Platform</label>
                <select id="social-platform" v-model="socialForm.platform" class="field__input" required>
                    <option value="" disabled>Choose a platform…</option>
                    <option v-for="platform in SOCIAL_PLATFORMS" :key="platform.value" :value="platform.value">
                        {{ platform.label }}
                    </option>
                </select>
            </div>

            <div v-if="selectedPlatform" class="field">
                <label class="field__label" for="social-value">{{ selectedPlatform.fieldLabel }}</label>
                <input id="social-value" v-model="socialForm.value" class="field__input" type="text" :placeholder="selectedPlatform.placeholder">
            </div>

            <div class="modal-actions">
                <button type="button" class="modal-actions__cancel" @click="socialModalOpen = false">Cancel</button>
                <button type="button" class="modal-actions__confirm" :disabled="!canSaveSocial" @click="saveSocial">
                    {{ editingSocialId ? 'Save' : 'Add' }}
                </button>
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
import type { DayHours, DayOfWeek, Site, SiteAddress, SiteCompanyInfo, SocialLink, ToastMessage } from '../../../types'
import { SOCIAL_PLATFORMS, socialPlatformLabel } from '../../../utils/socialPlatforms'

definePageMeta({ layout: 'site' })

const DAYS_OF_WEEK: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<DayOfWeek, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
}

const TABS = [
    { key: 'address', label: 'Address' },
    { key: 'hours', label: 'Opening hours' },
    { key: 'socials', label: 'Socials' }
] as const

const activeTab = ref<typeof TABS[number]['key']>('address')

const route = useRoute()
const siteId = String(route.params.siteId)

const { data: siteData } = await useFetch<{ site: Site }>(`/api/sites/${siteId}`)
const site = computed(() => siteData.value?.site ?? null)

const address = reactive<SiteAddress>({
    businessName: '',
    line1: '',
    line2: '',
    town: '',
    city: '',
    postcode: '',
    email: '',
    phone: ''
})

interface DayHoursForm { closed: boolean, open: string, close: string }

const openingHours = reactive<Record<DayOfWeek, DayHoursForm>>(
    Object.fromEntries(DAYS_OF_WEEK.map(day => [day, { closed: false, open: '', close: '' }])) as Record<DayOfWeek, DayHoursForm>
)

const socials = ref<SocialLink[]>([])

function loadFromCompanyInfo(companyInfo: SiteCompanyInfo | null | undefined) {
    const loadedAddress = companyInfo?.address
    address.businessName = loadedAddress?.businessName ?? ''
    address.line1 = loadedAddress?.line1 ?? ''
    address.line2 = loadedAddress?.line2 ?? ''
    address.town = loadedAddress?.town ?? ''
    address.city = loadedAddress?.city ?? ''
    address.postcode = loadedAddress?.postcode ?? ''
    address.email = loadedAddress?.email ?? ''
    address.phone = loadedAddress?.phone ?? ''

    for (const day of DAYS_OF_WEEK) {
        const hours = companyInfo?.openingHours?.[day]
        openingHours[day].closed = hours?.closed ?? false
        openingHours[day].open = hours?.open ?? ''
        openingHours[day].close = hours?.close ?? ''
    }

    socials.value = companyInfo?.socials ?? []
}

watch(site, (value) => {
    if (!value) return
    loadFromCompanyInfo(value.company_info)
}, { immediate: true })

const socialModalOpen = ref(false)
const editingSocialId = ref<string | null>(null)
const socialForm = reactive({ platform: '', value: '' })

const selectedPlatform = computed(() => SOCIAL_PLATFORMS.find(platform => platform.value === socialForm.platform))
const canSaveSocial = computed(() => Boolean(socialForm.platform) && socialForm.value.trim().length > 0)

function openAddSocial() {
    editingSocialId.value = null
    socialForm.platform = ''
    socialForm.value = ''
    socialModalOpen.value = true
}

function openEditSocial(social: SocialLink) {
    editingSocialId.value = social.id
    socialForm.platform = social.platform
    socialForm.value = social.url
    socialModalOpen.value = true
}

function saveSocial() {
    if (!canSaveSocial.value) return

    if (editingSocialId.value) {
        const id = editingSocialId.value
        socials.value = socials.value.map(social =>
            social.id === id ? { ...social, platform: socialForm.platform, url: socialForm.value.trim() } : social
        )
    } else {
        socials.value = [...socials.value, { id: crypto.randomUUID(), platform: socialForm.platform, url: socialForm.value.trim() }]
    }

    socialModalOpen.value = false
}

function removeSocial(id: string) {
    socials.value = socials.value.filter(social => social.id !== id)
}

const saving = ref(false)
const toast = ref<ToastMessage | null>(null)

async function handleSave() {
    saving.value = true

    try {
        const companyInfo: SiteCompanyInfo = {
            address: { ...address },
            openingHours: Object.fromEntries(
                DAYS_OF_WEEK.map(day => [day, { ...openingHours[day] } satisfies DayHours])
            ) as Record<DayOfWeek, DayHours>,
            socials: socials.value
        }
        await $fetch(`/api/sites/${siteId}`, { method: 'PATCH', body: { companyInfo } })
        toast.value = { message: 'Saved.', variant: 'success' }
    } catch (error) {
        toast.value = { message: error instanceof Error ? error.message : 'Failed to save company info', variant: 'error' }
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.company-info-view {
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
        margin: 0 0 $space-5;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__add {
        background: none;
        border: none;
        color: $color-primary;
        cursor: pointer;
        font-weight: 600;
        margin-top: $space-3;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-dark;
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

.tabs {
    border-bottom: 1px solid $color-border;
    display: flex;
    gap: $space-2;
    margin-bottom: $space-5;

    @media (prefers-color-scheme: dark) {
        border-color: $color-border-dark;
    }

    &__tab {
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: $color-text-muted;
        cursor: pointer;
        font-size: $font-size-base;
        font-weight: 600;
        margin-bottom: -1px;
        padding: $space-3 $space-2;

        @include visible-focus-ring;

        &:hover {
            color: $color-text;
        }

        &--active {
            border-bottom-color: $color-primary;
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;

            &:hover {
                color: $color-text-dark;
            }

            &--active {
                border-bottom-color: $color-primary-dark;
                color: $color-primary-dark;
            }
        }
    }
}

.tab-panel {
    @include card;

    max-width: 40rem;
}

.field-grid {
    display: grid;
    gap: $space-4;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-1;

    &--wide {
        grid-column: 1 / -1;
    }

    &__label {
        color: $color-text;
        font-size: $font-size-sm;
        font-weight: 600;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__input {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        padding: $space-2 $space-3;
        width: 100%;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}

.hours-grid {
    display: flex;
    flex-direction: column;
    gap: $space-3;
}

.hours-row {
    align-items: center;
    display: grid;
    gap: $space-3;
    grid-template-columns: 6.5rem 6rem minmax(7rem, 1fr) 1.5rem minmax(7rem, 1fr);
    min-height: 2.75rem;

    &__day {
        color: $color-text;
        font-size: $font-size-sm;
        font-weight: 600;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__closed {
        align-items: center;
        color: $color-text-muted;
        display: flex;
        font-size: $font-size-sm;
        gap: $space-2;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__to {
        color: $color-text-muted;
        font-size: $font-size-sm;
        text-align: center;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__closed-label {
        color: $color-text-subtle;
        font-size: $font-size-sm;
        grid-column: 3 / -1;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }
}

.socials-list {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__empty {
        color: $color-text-muted;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}

.socials-row {
    align-items: center;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    display: flex;
    gap: $space-3;
    padding: $space-2 $space-3;

    @media (prefers-color-scheme: dark) {
        border-color: $color-border-dark;
    }

    &__platform {
        color: $color-text;
        flex-shrink: 0;
        font-weight: 700;
        width: 6rem;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__value {
        @include truncate;

        color: $color-text-muted;
        flex: 1;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__edit,
    &__remove {
        background: none;
        border: none;
        cursor: pointer;
        display: inline-flex;
        flex-shrink: 0;
    }

    &__edit {
        color: $color-text-muted;

        &:hover {
            color: $color-primary;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__remove {
        color: $color-danger;

        @media (prefers-color-scheme: dark) {
            color: $color-danger-dark;
        }
    }
}

.modal-actions {
    display: flex;
    gap: $space-3;
    justify-content: flex-end;
    margin-top: $space-4;

    &__cancel {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        padding: $space-2 $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    &__confirm {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-2 $space-4;

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
</style>
