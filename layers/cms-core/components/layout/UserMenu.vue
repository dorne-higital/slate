<template>
    <div class="user-menu">
        <div class="user-menu__identity">
            <span class="user-menu__avatar" aria-hidden="true">{{ initials }}</span>
            <span class="user-menu__text">
                <span class="user-menu__name">{{ displayName }}</span>
                <span class="user-menu__email">{{ user?.email }}</span>
            </span>
        </div>
        <button type="button" class="user-menu__logout" @click="handleLogout">
            Log out
        </button>
    </div>
</template>

<script setup lang="ts">
const client = useSupabaseClient()
const user = useSupabaseUser()

const displayName = computed(() => user.value?.email?.split('@')[0] ?? 'Account')

const initials = computed(() => {
    const name = displayName.value
    return name.slice(0, 2).toUpperCase()
})

async function handleLogout() {
    await client.auth.signOut()
    await navigateTo('/login')
}
</script>

<style lang="scss" scoped>
.user-menu {
    align-items: center;
    display: flex;
    gap: $space-3;
    justify-content: space-between;

    &__identity {
        align-items: center;
        display: flex;
        gap: $space-3;
        min-width: 0;
    }

    &__avatar {
        align-items: center;
        background: none;
        border: 1.5px solid $color-primary;
        border-radius: 999px;
        color: $color-primary;
        display: flex;
        flex-shrink: 0;
        font-size: $font-size-sm;
        font-weight: 700;
        height: 2rem;
        justify-content: center;
        width: 2rem;

        @media (prefers-color-scheme: dark) {
            border-color: $color-primary-dark;
            color: $color-primary-dark;
        }
    }

    &__text {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    &__name {
        @include truncate;

        color: $color-text;
        font-size: $font-size-sm;
        font-weight: 600;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__email {
        @include truncate;

        color: $color-text-muted;
        font-size: 0.75rem;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__logout {
        background: none;
        border: none;
        color: $color-danger;
        cursor: pointer;
        flex-shrink: 0;
        font-size: $font-size-sm;
        font-weight: 600;
        padding: $space-1;

        &:hover {
            text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-danger-dark;
        }
    }
}
</style>
