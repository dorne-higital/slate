<script setup lang="ts">
// A silent demo video of the real CMS in a browser frame. Loads nothing until it's near the screen,
// plays only while visible, has a pause button, and never autoplays for people who prefer less motion.
const props = defineProps<{ name: string, caption: string, address?: string }>()
const video = ref<HTMLVideoElement>()
const playing = ref(false)
const missing = ref(false)
let reduced = false
let io: IntersectionObserver | undefined

function play() {
    video.value?.play().then(() => {
        playing.value = true
    }).catch(() => {
        playing.value = false
    })
}
function pause() {
    video.value?.pause()
    playing.value = false
}
const userPaused = ref(false)
function toggle() {
    if (playing.value) {
        userPaused.value = true
        pause()
    } else {
        userPaused.value = false
        play()
    }
}
onMounted(() => {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!video.value || reduced || !('IntersectionObserver' in window)) return
    io = new IntersectionObserver(([e]) => {
        if (e!.intersectionRatio >= 0.5 && !userPaused.value) play()
        else if (e!.intersectionRatio < 0.5) pause()
    }, { threshold: [0, 0.5] })
    io.observe(video.value)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
    <figure class="mk-video">
        <div class="frame">
            <div class="chrome" aria-hidden="true">
                <span class="dots"><i /><i /><i /></span>
                <span class="addr">{{ address ?? 'slatecms.co.uk' }}</span>
            </div>
            <div class="screen">
                <video
                    v-if="!missing"
                    ref="video"
                    :poster="`/videos/${props.name}.webp`"
                    muted
                    loop
                    playsinline
                    preload="none"
                    :aria-label="caption"
                    @error="missing = true"
                >
                    <source :src="`/videos/${props.name}.mp4`" type="video/mp4" @error="missing = true">
                </video>
                <div v-else class="soon">Video coming soon</div>
                <button v-if="!missing" type="button" class="pp" :aria-label="playing ? 'Pause video' : 'Play video'" @click="toggle">
                    <svg v-if="playing" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 2h3v10H3zM8 2h3v10H8z" fill="currentColor" /></svg>
                    <svg v-else width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 1.5l9 5.5-9 5.5z" fill="currentColor" /></svg>
                </button>
            </div>
        </div>
        <figcaption>{{ caption }}</figcaption>
    </figure>
</template>

<style scoped>
.mk-video { margin: 0; }
.frame { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px #d4d8df, 3px 3px 0 #c3c8d1, 6px 6px 0 #8c93a3, 0 30px 60px -20px rgb(46 52 69 / 35%); overflow: hidden; }
.chrome { align-items: center; background: var(--mist); display: flex; gap: 12px; height: 34px; padding: 0 12px; }
.dots { display: flex; gap: 6px; }
.dots i { background: #c3c8d1; border-radius: 50%; height: 10px; width: 10px; }
.addr { background: var(--white); border-radius: 999px; color: var(--text-muted); flex: 1; font-size: 12px; max-width: 280px; padding: 3px 12px; }
.screen { aspect-ratio: 16 / 10; background: var(--paper); position: relative; }
video { display: block; height: 100%; object-fit: cover; width: 100%; }
.soon { align-items: center; color: var(--text-muted); display: flex; font-size: 14px; height: 100%; justify-content: center; }
.pp { align-items: center; background: rgb(46 52 69 / 78%); border: 0; border-radius: 50%; bottom: 12px; color: var(--white); cursor: pointer; display: flex; height: 36px; justify-content: center; position: absolute; right: 12px; width: 36px; }
.pp:hover { background: var(--quarry); }
.pp:focus-visible { outline: 3px solid var(--lichen-focus); }
figcaption { color: var(--text-muted); font-size: 14px; margin-top: 14px; text-align: center; }
</style>
