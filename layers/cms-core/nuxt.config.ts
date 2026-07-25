import { createResolver } from '@nuxt/kit'

const { resolve } = createResolver(import.meta.url)

export default defineNuxtConfig({
    modules: [
        '@nuxtjs/supabase',
        '@nuxtjs/seo',
        'nuxt-security'
    ],

    // Every template in this layer refers to components by their bare
    // filename (<SkipLink>, <StatTile>, ...) — without this, Nuxt's
    // default directory-based prefixing would register e.g.
    // components/admin/StatTile.vue as <AdminStatTile> instead.
    //
    // global: true is required specifically for components/blocks/* —
    // BlockRenderer and the page builder canvas only ever reference them
    // through <component :is="someString"> (see utils/blockComponents.ts),
    // never as a literal tag Nuxt's compiler can see. Without global
    // registration on the app instance, that runtime string never
    // resolves to anything and silently falls back to rendering an
    // unknown HTML element instead of the block.
    components: [
        {
            path: resolve('./components'),
            pathPrefix: false,
            global: true
        }
    ],

    css: [
        resolve('./assets/styles/main.scss')
    ],

    vite: {
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: [
                        '@use "' + resolve('./assets/styles/_variables.scss') + '" as *;',
                        '@use "' + resolve('./assets/styles/_mixins.scss') + '" as *;',
                        ''
                    ].join('\n')
                }
            }
        },
        server: {
            // Vite's dev server rejects requests for hostnames it doesn't
            // recognize (DNS-rebinding protection) — this is separate from,
            // and in addition to, the tenant-resolution middleware's own
            // matching. Without it {slug}.localhost would 403 before the
            // middleware ever got a chance to run, in dev only (this check
            // doesn't exist in production).
            allowedHosts: ['.localhost']
        }
    },

    app: {
        head: {
            htmlAttrs: {
                lang: 'en'
            }
        }
    },

    // Set via NUXT_PUBLIC_BASE_DOMAIN once you own a real domain and have
    // wired up wildcard DNS + a wildcard cert on your host (see README.md
    // "Wildcard subdomains per site"). Public — not a secret, it's a
    // domain name that's necessarily visible in the URL bar the moment
    // it's used — needed both server-side (resolve-tenant-domain.ts) and
    // client-side (SiteSidebar's live-site link, built without a round
    // trip to the server).
    runtimeConfig: {
        public: {
            baseDomain: ''
        }
    },

    // The whole cms-core app (admin + site dashboards) is authenticated
    // tooling, not public content — default every route to noindex.
    // Client-facing site rendering (a future layer) overrides this
    // per-page via useSeoMeta({ robots: 'index, follow' }) or `site.indexable`.
    site: {
        indexable: false
    },

    robots: {
        disallow: ['/']
    },

    // @nuxtjs/seo bundles OG image generation, which needs a native
    // renderer dependency (@takumi-rs/core or similar) neither useful nor
    // installed for an authenticated dashboard that's noindexed anyway.
    // Keep the rest of the module (robots, sitemap, site config).
    ogImage: false,

    // Supabase Auth handles its own redirect flow via useAuthRedirect()
    // and middleware/auth.global.ts — the module's built-in redirect is
    // disabled to avoid the two systems fighting over navigation.
    supabase: {
        redirect: false
    },

    security: {
        headers: {
            contentSecurityPolicy: {
                'base-uri': ["'self'"],
                'font-src': ["'self'", 'https:', 'data:'],
                'form-action': ["'self'"],
                'frame-ancestors': ["'none'"],
                'img-src': ["'self'", 'data:', 'https:'],
                'object-src': ["'none'"],
                'script-src': ["'self'", "'nonce-{{nonce}}'", "'strict-dynamic'"],
                // A CSP directive drops 'unsafe-inline' entirely the
                // moment a nonce is also present — and there's no such
                // thing as a nonce on a style="" attribute. Vue/Nuxt
                // components routinely need dynamic inline styles (block
                // background images, tree indentation, ...), so style-src
                // alone can't be both nonce-strict and support those.
                // style-src-attr/-elem (CSP3) split the two: keep the
                // nonce for <style> tags, allow inline style attributes
                // specifically. style-src stays as the fallback for
                // browsers that don't support the split directives.
                // fonts.googleapis.com: a site's theme can pick a Google
                // Font (utils/siteFonts.ts), loaded via a plain <link
                // rel="stylesheet"> — the actual font files it references
                // come from fonts.gstatic.com, already covered by the
                // font-src https: above.
                'style-src': ["'self'", "'nonce-{{nonce}}'", 'https://fonts.googleapis.com'],
                'style-src-attr': ["'self'", "'unsafe-inline'"],
                'style-src-elem': ["'self'", "'nonce-{{nonce}}'", 'https://fonts.googleapis.com'],
                'upgrade-insecure-requests': true
            },
            crossOriginEmbedderPolicy: 'unsafe-none',
            permissionsPolicy: {
                camera: [],
                microphone: [],
                geolocation: [],
                payment: [],
                usb: []
            },
            strictTransportSecurity: {
                maxAge: 63072000,
                includeSubdomains: true,
                preload: true
            }
        },
        rateLimiter: {
            tokensPerInterval: 150,
            interval: 'hour',
            throwError: true
        },
        // Default upload limit (8MB) is tight for real photography —
        // media library uploads go through POST /api/media.
        requestSizeLimiter: {
            maxRequestSizeInBytes: 2_000_000,
            maxUploadFileRequestInBytes: 15_000_000
        }
    }
})
