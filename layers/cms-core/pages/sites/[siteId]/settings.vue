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
                <p class="field__hint">{{ slugHint }}</p>
            </div>

            <div class="field">
                <label class="field__label" for="site-domain">Custom domain</label>
                <input id="site-domain" v-model="customDomain" class="field__input" type="text" placeholder="www.example.com">
                <p class="field__hint">
                    Optional — your site is already live at {{ freeSiteUrl }} without doing anything below.
                    Only fill this in if you want visitors to reach it at a domain you own instead.
                    <strong>Saving doesn't make it live by itself</strong> — you'll still need to add one DNS
                    record at wherever you bought the domain, which we'll walk you through right after you save.
                </p>
            </div>

            <p v-if="saveError" role="alert" class="settings-form__error">{{ saveError }}</p>
            <p v-if="vercelWarning" role="alert" class="settings-form__error">{{ vercelWarning }}</p>
            <p v-if="saveStatus" role="status" class="settings-form__status">{{ saveStatus }}</p>

            <button type="submit" class="settings-form__submit" :disabled="saving">
                {{ saving ? 'Saving…' : (customDomain ? 'Save & show DNS steps' : 'Save') }}
            </button>
        </form>

        <section v-if="domainStatus?.hasDomain" class="go-live" aria-labelledby="go-live-heading">
            <h2 id="go-live-heading" class="go-live__title">Going live</h2>
            <p class="go-live__intro">
                Both the domain you entered and its www/non-www version need to work, so we've set both up —
                each still needs its own DNS record added at your registrar (Hostinger, GoDaddy, Namecheap, 123
                Reg, IONOS, wherever you bought it — usually under "DNS" or "Advanced DNS").
            </p>

            <div class="go-live__domain">
                <div class="go-live__domain-header">
                    <span class="go-live__domain-name">{{ domainStatus.domain }} <span class="go-live__tag">(main)</span></span>
                    <span class="go-live__badge" :class="domainStatus.verified ? 'go-live__badge--verified' : 'go-live__badge--pending'">
                        {{ domainStatus.verified ? 'Live' : 'Waiting on DNS' }}
                    </span>
                </div>

                <dl v-if="!domainStatus.verified && domainStatus.record" class="go-live__record">
                    <div>
                        <dt>Type</dt>
                        <dd>{{ domainStatus.record.type }}</dd>
                    </div>
                    <div>
                        <dt>Name / Host</dt>
                        <dd>{{ domainStatus.record.name }}</dd>
                    </div>
                    <div>
                        <dt>Value / Points to</dt>
                        <dd>{{ domainStatus.record.value }}</dd>
                    </div>
                </dl>
            </div>

            <div class="go-live__domain">
                <div class="go-live__domain-header">
                    <span class="go-live__domain-name">{{ domainStatus.counterpart }} <span class="go-live__tag">(redirects to main)</span></span>
                    <span class="go-live__badge" :class="domainStatus.counterpartVerified ? 'go-live__badge--verified' : 'go-live__badge--pending'">
                        {{ domainStatus.counterpartVerified ? 'Live' : 'Waiting on DNS' }}
                    </span>
                </div>

                <dl v-if="!domainStatus.counterpartVerified && domainStatus.counterpartRecord" class="go-live__record">
                    <div>
                        <dt>Type</dt>
                        <dd>{{ domainStatus.counterpartRecord.type }}</dd>
                    </div>
                    <div>
                        <dt>Name / Host</dt>
                        <dd>{{ domainStatus.counterpartRecord.name }}</dd>
                    </div>
                    <div>
                        <dt>Value / Points to</dt>
                        <dd>{{ domainStatus.counterpartRecord.value }}</dd>
                    </div>
                </dl>
            </div>

            <p v-if="!domainStatus.verified || !domainStatus.counterpartVerified" class="go-live__note">
                Add both records, then click Recheck. This usually takes a few minutes, occasionally up to
                24–48 hours depending on your registrar — that's normal. Your site keeps working at
                {{ freeSiteUrl }} the whole time either way.
            </p>

            <button type="button" class="go-live__recheck" :disabled="checkingDomain" @click="() => checkDomainStatus()">
                {{ checkingDomain ? 'Checking…' : 'Recheck' }}
            </button>
        </section>
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

const { public: { baseDomain } } = useRuntimeConfig()
const currentHost = useRequestURL().host
const slugHint = computed(() =>
    baseDomain
        ? `Also used in the site's live subdomain: ${slug.value}.${baseDomain}`
        : `Used in the preview URL: /preview/${slug.value}/…`
)
const freeSiteUrl = computed(() => buildTenantUrl(currentHost, slug.value, baseDomain, `/preview/${slug.value}`))

watch(site, (value) => {
    if (!value) return
    name.value = value.name
    slug.value = value.slug
    customDomain.value = value.custom_domain ?? ''
}, { immediate: true })

interface DomainStatus {
    hasDomain: boolean
    domain?: string
    verified?: boolean
    record?: { type: string, name: string, value: string }
    counterpart?: string
    counterpartVerified?: boolean
    counterpartRecord?: { type: string, name: string, value: string }
}

// useFetch (not a plain ref + manual $fetch) so this loads automatically
// on every visit to this page — server-rendered on first load, and its
// result travels in the SSR payload so the client doesn't even have to
// re-fetch it on hydration. Nothing here depends on clicking Save.
const { data: domainStatus, pending: checkingDomain, refresh: checkDomainStatus } = await useFetch<DomainStatus>(
    `/api/sites/${siteId}/domain-status`
)

const saving = ref(false)
const saveError = ref('')
const saveStatus = ref('')
const vercelWarning = ref('')

async function handleSave() {
    saving.value = true
    saveError.value = ''
    saveStatus.value = ''
    vercelWarning.value = ''

    try {
        const result = await $fetch<{ vercelWarning?: string }>(`/api/sites/${siteId}`, {
            method: 'PATCH',
            body: {
                name: name.value,
                slug: slug.value,
                customDomain: customDomain.value || null
            }
        })
        saveStatus.value = 'Saved.'
        vercelWarning.value = result.vercelWarning ?? ''
        await checkDomainStatus()
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

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
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

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
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

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }
}

.go-live {
    @include card;

    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-top: $space-6;
    max-width: 32rem;

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__intro,
    &__note {
        color: $color-text-muted;
        line-height: $line-height-base;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__domain {
        border-top: 1px solid $color-border;
        display: flex;
        flex-direction: column;
        gap: $space-2;
        padding-top: $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__domain-header {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: $space-3;
        justify-content: space-between;
    }

    &__domain-name {
        color: $color-text;
        font-family: $font-family-mono;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__tag {
        color: $color-text-muted;
        font-family: $font-family-base;
        font-weight: 400;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__badge {
        border-radius: 999px;
        font-size: $font-size-sm;
        font-weight: 700;
        padding: $space-1 $space-3;
        white-space: nowrap;

        &--verified {
            background: $color-success-bg;
            color: $color-success;
        }

        &--pending {
            background: $color-warning-bg;
            color: $color-warning;
        }

        @media (prefers-color-scheme: dark) {
            &--verified {
                background: $color-success-bg-dark;
                color: $color-success-dark;
            }

            &--pending {
                background: $color-warning-bg-dark;
                color: $color-warning-dark;
            }
        }
    }

    &__record {
        display: flex;
        flex-wrap: wrap;
        gap: $space-4;
        margin: 0;

        dt {
            color: $color-text-muted;
            font-size: $font-size-sm;

            @media (prefers-color-scheme: dark) {
                color: $color-text-muted-dark;
            }
        }

        dd {
            color: $color-text;
            font-family: $font-family-mono;
            font-weight: 700;
            margin: 0;

            @media (prefers-color-scheme: dark) {
                color: $color-text-dark;
            }
        }
    }

    &__recheck {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        font-size: $font-size-sm;
        padding: $space-3 $space-4;
        width: fit-content;

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-dark;
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

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
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
