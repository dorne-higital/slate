<template>
    <div class="register">
        <section class="register__hero">
            <span class="register__eyebrow">Register interest</span>
            <h1 class="register__title">Tell us about your site</h1>
            <p class="register__subtitle">
                Share a few details and we'll set your account and site up for you — no payment needed yet,
                we'll follow up by email.
            </p>
        </section>

        <section class="register__body">
            <form v-if="!submitted" class="register__form" novalidate @submit.prevent="handleSubmit">
                <div class="register__row">
                    <div class="field">
                        <label class="field__label" for="first-name">First name</label>
                        <input id="first-name" v-model="form.firstName" class="field__input" type="text" autocomplete="given-name" required>
                    </div>

                    <div class="field">
                        <label class="field__label" for="last-name">Last name</label>
                        <input id="last-name" v-model="form.lastName" class="field__input" type="text" autocomplete="family-name" required>
                    </div>
                </div>

                <div class="field">
                    <label class="field__label" for="email">Email</label>
                    <input id="email" v-model="form.email" class="field__input" type="email" autocomplete="email" placeholder="you@company.com" required>
                </div>

                <div class="field">
                    <label class="field__label" for="phone">Phone <span class="field__optional">(optional)</span></label>
                    <input id="phone" v-model="form.phone" class="field__input" type="tel" autocomplete="tel">
                </div>

                <div class="field">
                    <label class="field__label" for="site-name">Site name</label>
                    <input id="site-name" v-model="form.siteName" class="field__input" type="text" placeholder="Acme Studio" required>
                </div>

                <fieldset class="register__plans">
                    <legend class="field__label">Plan</legend>

                    <label v-for="tier in PLAN_TIERS" :key="tier.key" class="plan-option" :class="{ 'plan-option--selected': form.plan === tier.key }">
                        <input v-model="form.plan" type="radio" name="plan" :value="tier.key" class="plan-option__radio">
                        <span class="plan-option__body">
                            <span class="plan-option__name">{{ tier.name }}</span>
                            <span class="plan-option__tagline">{{ tier.tagline }}</span>
                        </span>
                        <span class="plan-option__price">{{ tier.priceMonthly }}<span v-if="tier.key !== 'free'">/mo</span></span>
                    </label>
                </fieldset>

                <p v-if="errorMessage" role="alert" class="register__message register__message--error">{{ errorMessage }}</p>

                <button type="submit" class="register__submit" :disabled="submitting">
                    {{ submitting ? 'Submitting…' : 'Register interest' }}
                </button>
            </form>

            <p v-else role="status" class="register__status">
                Thanks, {{ form.firstName }} — we've got your details for "{{ form.siteName }}" and will be in
                touch at {{ form.email }} to get your site set up.
            </p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { PLAN_TIERS } from '../utils/planTiers'

definePageMeta({ layout: 'marketing', public: true })

const form = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    siteName: '',
    plan: 'free' as 'free' | 'pro' | 'business'
})

const submitting = ref(false)
const submitted = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
    submitting.value = true
    errorMessage.value = ''

    try {
        await $fetch('/api/public/signup-requests', {
            method: 'POST',
            body: {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                siteName: form.siteName,
                plan: form.plan
            }
        })
        submitted.value = true
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Something went wrong — try again in a moment.'
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.register {
    font-family: $font-quicksand;
    margin: 0 auto;
    max-width: 42rem;
    padding: $space-2xl $space-lg;

    &__hero {
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        margin-bottom: $space-xl;
        text-align: center;
    }

    &__eyebrow {
        color: $color-primary;
        font-size: $text-eyebrow;
        font-weight: 700;
        letter-spacing: $tracking-wide;
        text-transform: uppercase;
    }

    &__title {
        font-size: $text-h1;
        font-weight: 700;
        margin: 0;
    }

    &__subtitle {
        color: $color-text-muted;
        margin: 0 auto;
        max-width: 32rem;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__body {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-marketing-lg;
        box-shadow: $shadow-sm;
        padding: $space-lg;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            box-shadow: $shadow-sm-dark;
        }
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $space-md;
    }

    &__row {
        display: grid;
        gap: $space-md;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    &__plans {
        border: none;
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        margin: 0;
        padding: 0;
    }

    &__message {
        border-radius: $radius-marketing-sm;
        font-size: $text-small;
        margin: 0;
        padding: $space-sm;

        &--error {
            background: $color-danger-bg;
            color: $color-danger;

            @media (prefers-color-scheme: dark) {
                background: $color-danger-bg-dark;
                color: $color-danger-dark;
            }
        }
    }

    &__submit {
        background: $color-primary;
        border: none;
        border-radius: $radius-pill;
        color: $color-primary-contrast;
        cursor: pointer;
        font-family: $font-quicksand;
        font-size: $text-small;
        font-weight: 600;
        padding: $space-sm;
        transition: box-shadow $transition-base;

        &:hover {
            box-shadow: $shadow-md;
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__status {
        color: $color-text;
        line-height: $leading-normal;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-2xs;

    &__label {
        color: $color-text;
        font-size: $text-small;
        font-weight: 600;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__optional {
        color: $color-text-subtle;
        font-weight: 400;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }

    &__input {
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-marketing-sm;
        color: $color-text;
        font-family: $font-quicksand;
        font-size: $text-small;
        padding: $space-sm;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}

.plan-option {
    align-items: center;
    border: 1px solid $color-border;
    border-radius: $radius-marketing-md;
    cursor: pointer;
    display: flex;
    gap: $space-sm;
    padding: $space-sm;
    transition: border-color $transition-base;

    &--selected {
        border-color: $color-primary;
    }

    &__radio {
        accent-color: $color-primary;
        flex-shrink: 0;
    }

    &__body {
        display: flex;
        flex: 1;
        flex-direction: column;
        min-width: 0;
    }

    &__name {
        color: $color-text;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__tagline {
        color: $color-text-muted;
        font-size: $text-small;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__price {
        color: $color-text;
        flex-shrink: 0;
        font-weight: 700;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    @media (prefers-color-scheme: dark) {
        border-color: $color-border-dark;

        &--selected {
            border-color: $color-primary-dark;
        }
    }
}
</style>
