<template>
    <Transition name="toast">
        <div
            v-if="modelValue"
            class="toast"
            :class="`toast--${modelValue.variant ?? 'success'}`"
            :role="modelValue.variant === 'error' ? 'alert' : 'status'"
        >
            {{ modelValue.message }}
        </div>
    </Transition>
</template>

<script setup lang="ts">
import type { ToastMessage } from '../../types'

const props = defineProps<{
    modelValue: ToastMessage | null
    duration?: number
}>()

const emit = defineEmits<{ 'update:modelValue': [ToastMessage | null] }>()

let timer: ReturnType<typeof setTimeout> | undefined

// Every new message restarts the clock — if a second save lands while
// the first's toast is still showing, it gets its own full duration
// rather than vanishing early on the first one's timer.
watch(() => props.modelValue, (value) => {
    clearTimeout(timer)
    if (value) {
        timer = setTimeout(() => emit('update:modelValue', null), props.duration ?? 1600)
    }
}, { immediate: true })

onBeforeUnmount(() => clearTimeout(timer))
</script>

<style lang="scss" scoped>
.toast {
    background: $color-surface-raised;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: $shadow-md;
    color: $color-text;
    font-weight: 600;
    left: 50%;
    max-width: 32rem;
    min-width: 16rem;
    padding: $space-3 $space-5;
    position: fixed;
    text-align: center;
    top: $space-4;
    transform: translateX(-50%);
    width: 50%;
    z-index: $z-index-modal;

    @media (prefers-color-scheme: dark) {
        background: $color-surface-raised-dark;
        border-color: $color-border-dark;
        box-shadow: $shadow-md-dark;
        color: $color-text-dark;
    }

    &--success {
        background: $color-success-bg;
        color: $color-success;

        @media (prefers-color-scheme: dark) {
            background: $color-success-bg-dark;
            color: $color-success-dark;
        }
    }

    &--error {
        background: $color-danger-bg;
        color: $color-danger;

        @media (prefers-color-scheme: dark) {
            background: $color-danger-bg-dark;
            color: $color-danger-dark;
        }
    }
}

.toast-enter-active,
.toast-leave-active {
    transition:
        opacity $transition-fast,
        transform $transition-fast;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translate(-50%, -0.5rem);
}
</style>
