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
        // Cloudflare for SaaS (client custom domains). Token needs SSL and Certificates: Edit on the zone.
        cloudflareApiToken: '',
        stripeSecretKey: '',
        stripeWebhookSecret: '',
        stripePortalConfig: '',
        namecomUsername: '',
        namecomToken: '',
        resendApiKey: '',
        turnstileSecret: '',
        emailFrom: 'hello@slatecms.co.uk',
        cloudflareZoneId: '',
        public: {
            // Cloudflare Turnstile site key (public). Empty = the check is switched off
            turnstileSiteKey: '',
            // Host the CMS itself is served from. Any other host is treated as a client site.
            appHost: 'localhost:3000',
            // Client sites get a free address at {slug}.{sitesDomain}
            sitesDomain: 'localhost:3000',
            // What clients point their domain's CNAME record at
            cnameTarget: 'sites.slatecms.co.uk'
        }
    },

    // Daily clean-up (server/tasks): runs from the Worker's cron trigger in wrangler.jsonc
    nitro: {
        experimental: { tasks: true },
        scheduledTasks: { '0 3 * * *': ['purge:deleted-sites'], '0 9 * * *': ['billing:trial-reminders'], '0 2 * * 1,4': ['backup:database'] },
        // Media library files: a local folder in development, R2 in production (below)
        devStorage: { media: { driver: 'fs', base: './.data/media' }, backups: { driver: 'fs', base: './.data/backups' } }
    },

    // Local dev: accept any hostname, so client custom domains can be tried with a Host header
    $development: {
        vite: { server: { allowedHosts: true } }
    },

    // Cloudflare preset for builds only. Local dev runs on plain Node: the Workers emulator
    // (workerd) needs macOS 13.5+, which this machine doesn't have.
    $production: {
        nitro: {
            preset: 'cloudflare_module',
            cloudflare: { nodeCompat: true },
            storage: { media: { driver: 'cloudflare-r2-binding', binding: 'MEDIA' }, backups: { driver: 'cloudflare-r2-binding', binding: 'MEDIA', base: '_backups' } }
        }
    }
})
