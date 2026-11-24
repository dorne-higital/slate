/**
 * The signed-in person and their sites. UX only (redirects, nav):
 * every API route re-checks access on the server with requireSiteAccess.
 */
export function useMe() {
    const me = useState<Me | null | undefined>('me', () => undefined)

    async function refresh() {
        try {
            me.value = await useRequestFetch()<Me | null>('/api/me')
        } catch {
            me.value = null
        }
        return me.value
    }

    async function ensure() {
        if (me.value === undefined) await refresh()
        return me.value
    }

    async function signOut() {
        await $fetch('/api/auth/sign-out', { method: 'POST', body: {} })
        me.value = null
        await navigateTo('/login')
    }

    return { me, refresh, ensure, signOut }
}
