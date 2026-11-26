// Slate: one Nuxt app, deployed as a single Cloudflare Worker.
// Runtime config is filled from NUXT_* env vars (.env locally, Worker secrets in production).
import { buildHelpIndex } from './scripts/help-index.mjs'

export default defineNuxtConfig({
    // Help articles (content/help/*.md) are bundled into a module before every build and dev start
    hooks: {
        'build:before': () => {
            buildHelpIndex()
        }
    },

    // A second dev server (the API tests' one) needs its own build folder, or the two overwrite each other
    ...(process.env.SLATE_BUILD_DIR ? { buildDir: process.env.SLATE_BUILD_DIR } : {}),
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
        // The Slate site whose blog is slatecms.co.uk/guides and whose Contact form takes /contact messages
        marketingSiteId: '',
        betterAuthSecret: '',
        // Cloudflare for SaaS (client custom domains). Token needs SSL and Certificates: Edit on the zone.
        cloudflareApiToken: '',
        // Domains Slate sells get their own Cloudflare zone (bare domain → www redirect). Token: Zone, DNS and
        // Single Redirect: Edit on all zones in the account. Empty = the older name.com DNS setup.
        cloudflareDomainsToken: '',
        stripeSecretKey: '',
        stripeWebhookSecret: '',
        stripePortalConfig: '',
        namecomUsername: '',
        namecomToken: '',
        resendApiKey: '',
        turnstileSecret: '',
        emailFrom: 'hello@slatecms.co.uk',
        cloudflareZoneId: '',
        // Cloudflare Web Analytics site tag, for reading visitor numbers back (needs Account Analytics: Read on the domains token)
        cfAnalyticsSiteTag: '',
        public: {
            // Cloudflare Turnstile site key (public). Empty = the check is switched off
            turnstileSiteKey: '',
            // Host the CMS itself is served from. Any other host is treated as a client site.
            appHost: 'localhost:3000',
            // Client sites get a free address at {slug}.{sitesDomain}
            sitesDomain: 'localhost:3000',
            // What clients point their domain's CNAME record at
            cnameTarget: 'sites.slatecms.co.uk',
            // Show the coming-soon page (with register-interest form) instead of the full home page
            comingSoon: false,
            // Cloudflare Web Analytics beacon token (public) for client sites' built-in visitor stats. Empty = off
            cfBeaconToken: ''
        }
    },

    // Daily clean-up (server/tasks): runs from the Worker's cron trigger in wrangler.jsonc
    nitro: {
        experimental: { tasks: true },
        scheduledTasks: { '0 3 * * *': ['purge:deleted-sites'], '0 9 * * *': ['billing:trial-reminders'], '0 2 * * 1,4': ['backup:database'], '*/10 * * * *': ['domains:check-pending'] },
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
