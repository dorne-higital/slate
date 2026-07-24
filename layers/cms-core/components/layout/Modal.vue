<template>
    <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -- dismiss-on-backdrop-click is a mouse-only convenience; the dialog's native ESC/close behavior is the real keyboard path -->
    <dialog ref="dialogEl" class="modal" aria-labelledby="modal-title" @click="handleBackdropClick" @close="handleClose">
        <div class="modal__panel">
            <div class="modal__header">
                <h2 id="modal-title" class="modal__title">{{ title }}</h2>
                <button type="button" class="modal__close" aria-label="Close" @click="close">
                    <IconClose />
                </button>
            </div>

            <div class="modal__body">
                <slot />
            </div>
        </div>
    </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
    title: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const dialogEl = ref<HTMLDialogElement | null>(null)

// showModal()/close() (not the "open" attribute) are what put a <dialog>
// in the browser's top layer with a real ::backdrop and native
// focus-trapping/ESC-to-close — reflecting modelValue as the "open"
// attribute instead would lose all of that.
watch(
    () => props.modelValue,
    (open) => {
        if (open && !dialogEl.value?.open) dialogEl.value?.showModal()
        else if (!open && dialogEl.value?.open) dialogEl.value?.close()
    },
    { immediate: true, flush: 'post' }
)

function close() {
    dialogEl.value?.close()
}

// Fires for every close path (the button above, ESC, and the backdrop
// click below) — the single place that syncs modelValue back, so the
// parent's v-model never gets out of sync with reality.
function handleClose() {
    emit('update:modelValue', false)
}

// A <dialog> opened via showModal() fills the viewport, so a click
// landing on the dialog element itself (rather than bubbling up from
// .modal__panel, which stops propagation via the click on the panel not
// being this element) means it was outside the visible panel.
function handleBackdropClick(event: MouseEvent) {
    if (event.target === dialogEl.value) close()
}
</script>

<style lang="scss" scoped>
.modal {
    @include card;

    border-radius: $radius-lg;
    box-shadow: 0 20px 48px rgb(0 0 0 / 24%);
    margin: auto;
    max-width: 32rem;
    padding: 0;
    width: calc(100% - #{$space-6});

    &::backdrop {
        background: rgb(0 0 0 / 45%);
    }

    &__panel {
        display: flex;
        flex-direction: column;
    }

    &__header {
        align-items: center;
        border-bottom: 1px solid $color-border;
        display: flex;
        justify-content: space-between;
        padding: $space-4;

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
        }
    }

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-lg;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__close {
        background: none;
        border: none;
        border-radius: $radius-sm;
        color: $color-text-muted;
        cursor: pointer;
        display: inline-flex;
        padding: $space-2;

        @include visible-focus-ring;

        &:hover {
            color: $color-primary;
        }
    }

    &__body {
        padding: $space-4;
    }
}
</style>
