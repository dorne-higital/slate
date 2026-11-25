<script setup lang="ts">
// The button row the showcase blocks share: ordinary buttons, or App Store / Google Play badges
// (links from Settings › App store links), with an optional QR code for people on a computer.
import { encode } from 'uqr'

const props = defineProps<{ kind?: string, buttonLabel?: string, buttonUrl?: string, button2Label?: string, button2Url?: string, qr?: string, align?: 'start' | 'center', inverse?: boolean }>()
const socials = inject<Ref<SiteSocials>>('siteSocials', ref({}))
const preview = inject<boolean>('blockPreview', false)

const stores = computed(() => props.kind === 'stores')
const appStore = computed(() => socials.value.appStore || (preview ? '#' : ''))
const googlePlay = computed(() => socials.value.googlePlay || (preview ? '#' : ''))
const missing = computed(() => preview && stores.value && (!socials.value.appStore || !socials.value.googlePlay))

// On a phone, lead with that phone's store and offer the other as a small link
const platform = ref<'' | 'ios' | 'android'>('')
onMounted(() => {
    const ua = navigator.userAgent
    platform.value = /iphone|ipad|ipod/i.test(ua) ? 'ios' : /android/i.test(ua) ? 'android' : ''
})
const showApple = computed(() => !!appStore.value && platform.value !== 'android')
const showGoogle = computed(() => !!googlePlay.value && platform.value !== 'ios')
const otherStore = computed(() => platform.value === 'ios' && googlePlay.value
    ? { label: 'On Android? Get it on Google Play', url: googlePlay.value }
    : platform.value === 'android' && appStore.value ? { label: 'On an iPhone? Get it on the App Store', url: appStore.value } : null)

// QR: store badges → this site's /get-app (sends each phone to its store); buttons → the main button's link
const requestUrl = useRequestURL()
const qrTarget = computed(() => {
    if (props.qr !== 'yes') return ''
    if (stores.value) return socials.value.appStore || socials.value.googlePlay ? `${requestUrl.origin}/get-app` : ''
    const url = props.buttonUrl ?? ''
    if (!props.buttonLabel || !url) return ''
    return url.startsWith('/') ? `${requestUrl.origin}${url}` : /^https?:\/\//.test(url) ? url : ''
})
const qrPath = computed(() => {
    if (!qrTarget.value) return null
    const { data, size } = encode(qrTarget.value, { border: 0 })
    let d = ''
    data.forEach((row, y) => row.forEach((on, x) => {
        if (on) d += `M${x} ${y}h1v1h-1z`
    }))
    return { d, size }
})
</script>

<template>
    <div class="sb" :class="{ centre: align === 'center', inverse }">
        <div class="row">
            <template v-if="stores">
                <a v-if="showApple" class="badge" :href="appStore">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></svg>
                    <span><small>Download on the</small>App Store</span>
                </a>
                <a v-if="showGoogle" class="badge" :href="googlePlay">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l14 9-14 9z" /></svg>
                    <span><small>Get it on</small>Google Play</span>
                </a>
            </template>
            <template v-else>
                <a v-if="buttonLabel" class="blk-btn" :href="buttonUrl || '#'">{{ buttonLabel }}</a>
                <a v-if="button2Label" class="blk-btn outline" :href="button2Url || '#'">{{ button2Label }}</a>
            </template>
            <div v-if="qrPath" class="qr">
                <svg :viewBox="`-2 -2 ${qrPath.size + 4} ${qrPath.size + 4}`" role="img" :aria-label="stores ? 'QR code to download the app' : `QR code for ${buttonLabel}`"><rect x="-2" y="-2" :width="qrPath.size + 4" :height="qrPath.size + 4" fill="#fff" /><path :d="qrPath.d" fill="#111" /></svg>
                <span>Scan with your<br>phone camera</span>
            </div>
        </div>
        <a v-if="stores && otherStore" class="other" :href="otherStore.url">{{ otherStore.label }}</a>
        <p v-if="missing" class="hint">Add your App Store and Google Play links in Settings › App store links. Until then, missing ones are hidden on your live site.</p>
    </div>
</template>

<style scoped>
.sb { display: flex; flex-direction: column; gap: 10px; }
.row { align-items: center; display: flex; flex-wrap: wrap; gap: 12px; }
.centre { align-items: center; }
.centre .row { justify-content: center; }
.badge { align-items: center; background: #111; border-radius: 10px; color: #fff; display: inline-flex; gap: 10px; min-height: 52px; padding: 8px 18px; text-decoration: none; }
.badge span { display: flex; flex-direction: column; font-size: 18px; font-weight: 600; line-height: 1.1; text-align: left; }
.badge small { font-size: 11px; font-weight: 400; }
.badge:hover { filter: brightness(1.25); }
:global(.sec.bg-dark) .badge, :global(.sec.bg-primary) .badge, :global(.sec.bg-accent) .badge, .inverse .badge { background: #fff; color: #111; }
.inverse .blk-btn { background: var(--site-primary-text); color: var(--site-primary); }
.inverse .blk-btn.outline { background: transparent; color: var(--site-primary-text); }
.qr { align-items: center; display: flex; gap: 10px; margin-left: 8px; }
.qr svg { border-radius: 8px; box-shadow: 0 0 0 1px rgb(0 0 0 / 8%); height: 84px; width: 84px; }
.qr span { color: inherit; font-size: 13px; line-height: 1.35; opacity: .85; }
.other { color: inherit; font-size: 14px; }
.hint { background: #fff7e6; border-radius: 8px; color: #7a4b05; font-size: 13px; margin: 0; max-width: 34em; padding: 8px 12px; }
@media (max-width: 800px), (hover: none) { .qr { display: none; } }
</style>
