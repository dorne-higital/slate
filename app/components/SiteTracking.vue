<script setup lang="ts">
/**
 * Analytics and ads tools for a client site. Plausible sets no cookies so it always runs;
 * Google Analytics and Meta Pixel only run after the visitor accepts cookies (UK GDPR / PECR).
 * Every ID here was checked against the tool's format on save, so it's safe to put in a script.
 */
const props = defineProps<{ integrations: SiteIntegrations }>()

const needsConsent = computed(() => !!(props.integrations.ga4 || props.integrations.metaPixel))
const consent = ref<'unknown' | 'yes' | 'no'>('unknown')
const showBanner = ref(false)
const KEY = 'slate-cookie-consent'

onMounted(() => {
    try {
        const saved = localStorage.getItem(KEY)
        if (saved === 'yes' || saved === 'no') consent.value = saved
    } catch {
        // Storage blocked: ask every visit
    }
    showBanner.value = needsConsent.value && consent.value === 'unknown'
})

function choose(answer: 'yes' | 'no') {
    consent.value = answer
    showBanner.value = false
    try {
        localStorage.setItem(KEY, answer)
    } catch {
        // Storage blocked: the choice lasts for this visit only
    }
}

// The footer's "Cookie settings" link reopens the banner
const reopen = () => (showBanner.value = true)
defineExpose({ reopen })

// Plausible: no cookies, always on
useHead(() => ({
    script: props.integrations.plausible
        ? [{ key: 'plausible', src: 'https://plausible.io/js/script.js', defer: true, 'data-domain': props.integrations.plausible }]
        : []
}))
// Google Analytics and Meta Pixel: only after "Accept"
useHead(() => {
    const { ga4, metaPixel } = props.integrations
    if (consent.value !== 'yes') return {}
    return {
        script: [
            ...(ga4
                ? [
                        { key: 'ga4-src', src: `https://www.googletagmanager.com/gtag/js?id=${ga4}`, async: true },
                        { key: 'ga4-init', innerHTML: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4}');` }
                    ]
                : []),
            ...(metaPixel
                ? [{ key: 'meta-pixel', innerHTML: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixel}');fbq('track','PageView');` }]
                : [])
        ]
    }
})
</script>

<template>
    <div v-if="showBanner" class="consent" role="dialog" aria-label="Cookies" aria-live="polite">
        <p>We’d like to use cookies to understand how people use this site{{ integrations.metaPixel ? ' and measure our ads' : '' }}. Is that OK?</p>
        <div class="consent-actions">
            <button type="button" class="c-btn primary" @click="choose('yes')">Accept</button>
            <button type="button" class="c-btn" @click="choose('no')">No thanks</button>
        </div>
    </div>
</template>

<style scoped>
.consent {
    align-items: center;
    background: var(--site-bg);
    border-radius: 10px;
    bottom: 16px;
    box-shadow: 0 8px 32px rgb(0 0 0 / 18%);
    color: var(--site-text);
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    left: 16px;
    max-width: 640px;
    padding: 16px 20px;
    position: fixed;
    right: 16px;
    z-index: 50;
}
.consent p { flex: 1 1 260px; font-size: 15px; line-height: 1.5; margin: 0; }
.consent-actions { display: flex; gap: 8px; }
.c-btn { background: transparent; border: 1.5px solid currentcolor; border-radius: var(--site-radius); color: var(--site-heading); cursor: pointer; font: inherit; font-weight: 700; padding: 9px 16px; }
.c-btn.primary { background: var(--site-primary); border-color: var(--site-primary); color: var(--site-primary-text); }
</style>
