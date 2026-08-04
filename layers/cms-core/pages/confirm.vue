<template>
    <div class="confirm">
        <div class="confirm__brand" aria-hidden="true">
            <BrandMark />
        </div>

        <div class="confirm__panel">
            <p class="confirm__eyebrow">Slate CMS</p>
            <h1 class="confirm__title">Set your password</h1>

            <p v-if="status === 'waiting'" class="confirm__status" role="status">Checking your invite link…</p>

            <p v-else-if="status === 'invalid'" role="alert" class="confirm__status confirm__status--error">
                This link has expired or was already used. Ask whoever invited you to send a new one.
            </p>

            <form v-else class="confirm__form" novalidate @submit.prevent="handleSubmit">
                <p class="confirm__subtitle">Choose a password to finish setting up your account.</p>

                <div class="field">
                    <label class="field__label" for="password">Password</label>
                    <input
                        id="password"
                        v-model="password"
                        class="field__input"
                        type="password"
                        autocomplete="new-password"
                        minlength="8"
                        required
                    >
                </div>

                <div class="field">
                    <label class="field__label" for="password-confirm">Confirm password</label>
                    <input
                        id="password-confirm"
                        v-model="passwordConfirm"
                        class="field__input"
                        type="password"
                        autocomplete="new-password"
                        minlength="8"
                        required
                    >
                </div>

                <p v-if="errorMessage" role="alert" class="confirm__status confirm__status--error">{{ errorMessage }}</p>

                <button type="submit" class="confirm__submit" :disabled="submitting">
                    {{ submitting ? 'Saving…' : 'Set password & continue' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Database } from '../types/database.types'

definePageMeta({ layout: 'auth', public: true })

const client = useSupabaseClient<Database>()
const user = useSupabaseUser()

const status = ref<'waiting' | 'ready' | 'invalid'>('waiting')
const password = ref('')
const passwordConfirm = ref('')
const submitting = ref(false)
const errorMessage = ref('')

onMounted(() => {
    if (user.value) {
        status.value = 'ready'
        return
    }

    // The invite link's token is exchanged for a session client-side,
    // asynchronously, right after mount — give it a moment before
    // concluding the link is actually invalid.
    const stop = watch(user, (value) => {
        if (value) {
            status.value = 'ready'
            stop()
        }
    })

    setTimeout(() => {
        if (!user.value) {
            status.value = 'invalid'
            stop()
        }
    }, 3000)
})

async function handleSubmit() {
    errorMessage.value = ''

    if (password.value.length < 8) {
        errorMessage.value = 'Password must be at least 8 characters.'
        return
    }

    if (password.value !== passwordConfirm.value) {
        errorMessage.value = "Passwords don't match."
        return
    }

    submitting.value = true
    const { error } = await client.auth.updateUser({ password: password.value })
    submitting.value = false

    if (error) {
        errorMessage.value = error.message
        return
    }

    const userId = user.value?.id
    const destination = userId
        ? await resolveAuthDestination(client, userId, useRequestURL().host, useRuntimeConfig().public.baseDomain)
        : '/login'

    await navigateTo(destination, { external: true })
}
</script>

<style lang="scss" scoped>
.confirm {
    display: flex;
    flex: 1;

    &__brand {
        align-items: center;
        display: none;
        flex: 1;
        justify-content: center;

        @media (width >= 900px) {
            display: flex;
        }
    }

    &__panel {
        align-items: center;
        display: flex;
        flex: 1;
        flex-direction: column;
        justify-content: center;
        padding: $space-6 $space-5;
    }

    &__eyebrow {
        @include eyebrow;

        margin: 0;
    }

    &__title {
        @include heading-font;

        font-size: $font-size-2xl;
        margin: $space-2 0;
        max-width: 22rem;
        width: 100%;
    }

    &__subtitle {
        color: $color-text-muted;
        margin: 0 0 $space-2;
        max-width: 22rem;
        width: 100%;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $space-4;
        max-width: 22rem;
        width: 100%;
    }

    &__status {
        color: $color-text-muted;
        max-width: 22rem;
        width: 100%;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }

        &--error {
            background: $color-danger-bg;
            border-radius: $radius-sm;
            color: $color-danger;
            padding: $space-3;

            @media (prefers-color-scheme: dark) {
                background: $color-danger-bg-dark;
                color: $color-danger-dark;
            }
        }
    }

    &__submit {
        background: $color-primary;
        border: none;
        border-radius: $radius-sm;
        color: $color-primary-contrast;
        cursor: pointer;
        font-size: $font-size-base;
        font-weight: 700;
        padding: $space-4;
        transition: background $transition-fast;

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

.field {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__label {
        color: $color-text;
        font-size: $font-size-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__input {
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        font-size: $font-size-base;
        padding: $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
