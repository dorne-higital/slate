<template>
    <div class="contact">
        <section class="contact__hero">
            <p class="contact__eyebrow">Contact</p>
            <h1 class="contact__title">Contact us</h1>
            <p class="contact__subtitle">
                Questions about plans, features, or your account? Send us a note and we'll get back to you.
            </p>
        </section>

        <section class="contact__body">
            <div class="contact__form-panel">
                <form v-if="!submitted" class="contact__form" novalidate @submit.prevent="handleSubmit">
                    <div class="field">
                        <label class="field__label" for="name">Name</label>
                        <input
                            id="name"
                            v-model="name"
                            class="field__input"
                            type="text"
                            name="name"
                            autocomplete="name"
                            placeholder="[Your name]"
                            required
                        >
                    </div>

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
                        <label class="field__label" for="message">Message</label>
                        <textarea
                            id="message"
                            v-model="message"
                            class="field__input field__input--textarea"
                            name="message"
                            rows="6"
                            placeholder="[What can we help with?]"
                            required
                        />
                    </div>

                    <button type="submit" class="contact__submit">
                        Send message
                    </button>
                </form>

                <p v-else role="status" class="contact__status">
                    Thanks - we'll get back to you soon.
                </p>
            </div>

            <div class="contact__info">
                <h2 class="contact__info-title">Other ways to reach us</h2>

                <dl class="contact__info-list">
                    <div class="contact__info-item">
                        <dt class="contact__info-label">Email</dt>
                        <dd class="contact__info-value">[Email address]</dd>
                    </div>

                    <div class="contact__info-item">
                        <dt class="contact__info-label">Phone</dt>
                        <dd class="contact__info-value">[Phone number]</dd>
                    </div>
                </dl>

                <p class="contact__info-response">
                    We typically reply within one business day.
                </p>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'marketing', public: true })

const name = ref('')
const email = ref('')
const message = ref('')
const submitted = ref(false)

function handleSubmit() {
    submitted.value = true
}
</script>

<style lang="scss" scoped>
.contact {
    margin: 0 auto;
    max-width: 72rem;
    padding: $space-7 $space-6 $space-8;

    &__hero {
        margin: 0 auto $space-8;
        max-width: 36rem;
        text-align: center;
    }

    &__eyebrow {
        @include eyebrow;

        margin: 0;
    }

    &__title {
        @include heading-font;

        font-size: $font-size-2xl;
        margin: $space-2 0;
    }

    &__subtitle {
        color: $color-text-muted;
        margin: 0;
    }

    &__body {
        display: grid;
        gap: $space-6;
        grid-template-columns: repeat(1, minmax(0, 1fr));

        @media (width >= 800px) {
            grid-template-columns: 3fr 2fr;
        }
    }

    &__form-panel {
        @include card;
    }

    &__form {
        display: flex;
        flex-direction: column;
        gap: $space-4;
    }

    &__status {
        background: $color-success-bg;
        border-radius: $radius-sm;
        color: $color-success;
        font-size: $font-size-base;
        margin: 0;
        padding: $space-4;
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

        &:hover {
            background: $color-primary-hover;
        }
    }

    &__info {
        @include card;
    }

    &__info-title {
        @include heading-font;

        font-size: $font-size-lg;
        margin: 0 0 $space-4;
    }

    &__info-list {
        display: flex;
        flex-direction: column;
        gap: $space-4;
        margin: 0 0 $space-5;
    }

    &__info-item {
        display: flex;
        flex-direction: column;
        gap: $space-1;
    }

    &__info-label {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;
    }

    &__info-value {
        color: $color-text;
        font-size: $font-size-base;
        font-weight: 600;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__info-response {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;
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
        font-family: $font-family-base;
        font-size: $font-size-base;
        padding: $space-3;

        &--textarea {
            resize: vertical;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }
}
</style>
