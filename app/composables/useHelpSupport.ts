/**
 * Where the help centre's "still stuck" links go: the site's Support page when signed in,
 * the contact page otherwise, or an email before launch (the contact page isn't out yet).
 * Call it with await: it checks who's signed in, since help pages are often opened fresh in a new tab.
 */
export async function useHelpSupport() {
    // Everything that needs Nuxt's context comes before the await
    const { me, ensure } = useMe()
    const { comingSoon } = useRuntimeConfig().public
    const site = computed(() => me.value?.sites[0])
    const to = computed(() => site.value ? `/sites/${site.value.id}/support` : comingSoon ? 'mailto:hello@slatecms.co.uk' : '/contact')
    const label = computed(() => site.value ? 'Ask in Support' : comingSoon ? 'Email us' : 'Contact us')
    await ensure()
    return { me, to, label }
}
