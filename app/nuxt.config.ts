export default defineNuxtConfig({
    extends: ['@slate/cms-core'],

    modules: [
        '@nuxt/eslint'
    ],

    compatibilityDate: '2025-07-15',

    // Its floating launcher docks in the bottom corner by default, which
    // overlaps the site sidebar's sticky footer (Logout button) and
    // silently swallows clicks there. Re-enable locally if useful, but
    // don't ship it on by default.
    devtools: {
        enabled: false
    },

    eslint: {
        config: {
            stylistic: false
        }
    }
})
