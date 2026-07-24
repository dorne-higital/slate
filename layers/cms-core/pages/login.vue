<template>
    <div class="login">
        <div class="login__brand" aria-hidden="true">
            <BrandMark />
        </div>

        <div class="login__panel">
            <p class="login__eyebrow">Slate CMS</p>
            <h1 class="login__title">Sign in</h1>
            <p class="login__subtitle">Manage your site's pages, content and settings.</p>

            <form class="login__form" novalidate @submit.prevent="handleSubmit">
                <div class="field">
                    <label class="field__label" for="email">Email</label>
                    <input
                        id="email"
                        v-model="email"
                        class="field__input"
                        type="email"
                        name="email"
                        autocomplete="email"
                        placeholder="you@company.com"
                        required
                    >
                </div>

                <div class="field">
                    <label class="field__label" for="password">Password</label>
                    <input
                        id="password"
                        v-model="password"
                        class="field__input"
                        type="password"
                        name="password"
                        autocomplete="current-password"
                        required
                    >
                </div>

                <button type="button" class="login__forgot" @click="handleForgotPassword">
                    Forgot password?
                </button>

                <p v-if="errorMessage" role="alert" class="login__message login__message--error">
                    {{ errorMessage }}
                </p>
                <p v-if="statusMessage" role="status" class="login__message login__message--status">
                    {{ statusMessage }}
                </p>

                <button type="submit" class="login__submit" :disabled="submitting">
                    {{ submitting ? 'Signing in…' : 'Sign in' }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const client = useSupabaseClient()
const route = useRoute()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')

async function handleSubmit() {
    submitting.value = true
    errorMessage.value = ''
    statusMessage.value = ''

    const { error } = await client.auth.signInWithPassword({
        email: email.value,
        password: password.value
    })

    submitting.value = false

    if (error) {
        errorMessage.value = error.message
        return
    }

    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'

    // A same-app client-side navigateTo() here races the Supabase auth
    // cookie write against the middleware's next read of useSupabaseUser()
    // and can bounce straight back to /login. Forcing a full page load
    // means the next request hits the server fresh, cookie already set,
    // middleware resolves the real session deterministically.
    await navigateTo(redirect, { external: true })
}

async function handleForgotPassword() {
    errorMessage.value = ''
    statusMessage.value = ''

    if (!email.value) {
        errorMessage.value = 'Enter your email above first, then select "Forgot password?"'
        return
    }

    const { error } = await client.auth.resetPasswordForEmail(email.value)

    if (error) {
        errorMessage.value = error.message
        return
    }

    statusMessage.value = `Password reset instructions sent to ${email.value}.`
}
</script>

<style lang="scss" scoped>
.login {
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
        margin: 0 0 $space-5;
        max-width: 22rem;
        width: 100%;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $space-4;
        max-width: 22rem;
        width: 100%;
    }

    &__forgot {
        background: none;
        border: none;
        color: $color-primary;
        cursor: pointer;
        font-size: $font-size-sm;
        font-weight: 600;
        padding: 0;
        text-align: left;
        text-decoration: underline;
        width: fit-content;
    }

    &__message {
        border-radius: $radius-sm;
        font-size: $font-size-sm;
        margin: 0;
        padding: $space-3;

        &--error {
            background: $color-danger-bg;
            color: $color-danger;
        }

        &--status {
            background: $color-success-bg;
            color: $color-success;
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
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: $space-2;

    &__label {
        color: $color-text;
        font-size: $font-size-sm;
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
