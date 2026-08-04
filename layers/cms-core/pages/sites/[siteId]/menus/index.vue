<template>
    <div class="menus-view">
        <div class="menus-view__header">
            <h1 class="menus-view__title">Menus</h1>
            <button type="button" class="menus-view__new" @click="openCreateModal">
                New menu
            </button>
        </div>

        <Modal v-model="createModalOpen" title="New menu">
            <form class="new-menu" novalidate @submit.prevent="handleCreate">
                <div class="field">
                    <label class="field__label" for="new-menu-name">Name</label>
                    <input id="new-menu-name" v-model="newMenu.name" class="field__input" type="text" required>
                </div>

                <div class="field">
                    <label class="field__label" for="new-menu-slot">Slot</label>
                    <select id="new-menu-slot" v-model="newMenu.slot" class="field__input" required>
                        <option value="" disabled>Choose a slot…</option>
                        <option v-for="slot in availableSlots" :key="slot" :value="slot">
                            {{ MENU_SLOT_LABELS[slot] }}
                        </option>
                    </select>
                    <p v-if="availableSlots.length === 0" class="field__hint">
                        Every slot already has a menu — edit or delete one of the menus below first.
                    </p>
                </div>

                <p v-if="createError" role="alert" class="new-menu__error">{{ createError }}</p>

                <div class="new-menu__buttons">
                    <button type="submit" class="new-menu__submit" :disabled="creating || availableSlots.length === 0">
                        {{ creating ? 'Creating…' : 'Create menu' }}
                    </button>
                    <button type="button" class="new-menu__cancel" @click="createModalOpen = false">
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>

        <p v-if="pending" class="menus-view__status" role="status">Loading menus…</p>
        <p v-else-if="menus.length === 0" class="menus-view__status" role="status">
            No menus yet. Select "New menu" to create the first one.
        </p>

        <div v-else class="menus-table-wrap">
            <table class="menus-table">
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Slot</th>
                        <th scope="col">Key</th>
                        <th scope="col">Updated</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="menu in menus" :key="menu.id">
                        <td>
                            <NuxtLink :to="`/sites/${siteId}/menus/${menu.id}`" class="menus-table__name">
                                {{ menu.name }}
                            </NuxtLink>
                        </td>
                        <td class="menus-table__muted">{{ MENU_SLOT_LABELS[menu.slot] }}</td>
                        <td class="menus-table__muted">{{ menu.slug }}</td>
                        <td class="menus-table__muted">{{ formatRelativeTime(menu.updated_at) }}</td>
                        <td>
                            <button
                                type="button"
                                class="menus-table__delete"
                                :aria-label="`Delete ${menu.name}`"
                                @click="handleDelete(menu)"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Menu, MenuSlot } from '../../../../types'
import { MENU_SLOT_LABELS } from '../../../../utils/siteLayoutStyles'

definePageMeta({ layout: 'site' })

const route = useRoute()
const siteId = String(route.params.siteId)

const { data, pending, refresh } = await useFetch<{ menus: Menu[] }>('/api/menus', {
    query: { siteId }
})

const menus = computed(() => data.value?.menus ?? [])

const ALL_SLOTS = Object.keys(MENU_SLOT_LABELS) as MenuSlot[]
const availableSlots = computed(() => ALL_SLOTS.filter(slot => !menus.value.some(menu => menu.slot === slot)))

const createModalOpen = ref(false)
const creating = ref(false)
const createError = ref('')
const newMenu = reactive<{ name: string, slot: MenuSlot | '' }>({ name: '', slot: '' })

function openCreateModal() {
    newMenu.name = ''
    newMenu.slot = availableSlots.value[0] ?? ''
    createError.value = ''
    createModalOpen.value = true
}

async function handleCreate() {
    if (!newMenu.slot) return

    creating.value = true
    createError.value = ''

    try {
        const { menu } = await $fetch<{ menu: Menu }>('/api/menus', {
            method: 'POST',
            body: { siteId, name: newMenu.name, slot: newMenu.slot }
        })
        createModalOpen.value = false
        await navigateTo(`/sites/${siteId}/menus/${menu.id}`)
    } catch (error) {
        createError.value = error instanceof Error ? error.message : 'Failed to create menu'
    } finally {
        creating.value = false
    }
}

async function handleDelete(menu: Menu) {
    if (!window.confirm(`Delete "${menu.name}"? This can't be undone.`)) return

    await $fetch(`/api/menus/${menu.id}`, {
        method: 'DELETE',
        query: { siteId }
    })
    await refresh()
}
</script>

<style lang="scss" scoped>
.menus-view {
    &__header {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-bottom: $space-5;
    }

    &__title {
        @include heading-font;

        color: $color-text;
        font-size: $font-size-2xl;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__new {
        background: $color-primary;
        border: none;
        border-radius: 999px;
        color: $color-primary-contrast;
        cursor: pointer;
        font-weight: 700;
        padding: $space-3 $space-5;

        &:hover {
            background: $color-primary-hover;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__status {
        color: $color-text-muted;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}

.menus-table-wrap {
    overflow-x: auto;
}

.menus-table {
    border-collapse: collapse;
    width: 100%;

    th {
        @include eyebrow;

        border-bottom: 1px solid $color-border;
        padding: $space-2 $space-3;
        text-align: left;
        white-space: nowrap;

        @media (prefers-color-scheme: dark) {
            border-bottom: 1px solid $color-border-dark;
            border-color: $color-border-dark;
        }
    }

    td {
        border-bottom: 1px solid $color-border;
        color: $color-text;
        padding: $space-3;
        vertical-align: middle;

        @media (prefers-color-scheme: dark) {
            border-bottom: 1px solid $color-border-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;
        }
    }

    tbody tr:hover {
        background: $color-surface;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
        }
    }

    &__name {
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

    &__muted {
        color: $color-text-muted;
        white-space: nowrap;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__delete {
        background: none;
        border: none;
        color: $color-danger;
        cursor: pointer;
        font-weight: 600;

        &:hover {
            opacity: 0.7;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-danger-dark;
        }
    }
}

.new-menu {
    display: flex;
    flex-direction: column;
    gap: $space-3;

    &__error {
        background: $color-danger-bg;
        border-radius: $radius-sm;
        color: $color-danger;
        font-size: $font-size-sm;
        margin: 0;
        padding: $space-2 $space-3;

        @media (prefers-color-scheme: dark) {
            background: $color-danger-bg-dark;
            color: $color-danger-dark;
        }
    }

    &__buttons {
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

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__cancel {
        background: none;
        border: 1px solid $color-border;
        border-radius: $radius-sm;
        color: $color-text;
        cursor: pointer;
        padding: $space-3 $space-4;

        @media (prefers-color-scheme: dark) {
            border: 1px solid $color-border-dark;
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

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
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

    &__hint {
        color: $color-text-muted;
        font-size: $font-size-sm;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }
}
</style>
