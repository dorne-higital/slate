// Slate: one Nuxt app, deployed as a single Cloudflare Worker.
// Runtime config is filled from NUXT_* env vars (.env locally, Worker secrets in production).
export default defineNuxtConfig({
    compatibilityDate: '2026-11-01',
    devtools: { enabled: false },

    css: ['~/assets/css/main.css', '~/assets/css/blocks.css'],

    // Bare component names everywhere: components/cms/Sidebar.vue → <Sidebar>
    components: [{ path: '~/components', pathPrefix: false }],

    app: {
        head: {
            htmlAttrs: { lang: 'en-GB' },
            link: [
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&display=swap' }
            ]
        }
    },

    runtimeConfig: {
        databaseUrl: '',
        betterAuthSecret: '',
        public: {
            // Host the CMS itself is served from. Any other host is treated as a client site.
            appHost: 'localhost:3000',
            // Client sites get a free address at {slug}.{sitesDomain}
            sitesDomain: 'localhost:3000'
        }
    },

    // Cloudflare preset for builds only. Local dev runs on plain Node: the Workers emulator
    // (workerd) needs macOS 13.5+, which this machine doesn't have.
    $production: {
        nitro: {
            preset: 'cloudflare_module',
            cloudflare: { nodeCompat: true }
        }
    }
})
