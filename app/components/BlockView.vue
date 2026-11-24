<script setup lang="ts">
import type { Component } from 'vue'
import BlockBeforeAfter from './blocks/BlockBeforeAfter.vue'
import BlockBooking from './blocks/BlockBooking.vue'
import BlockContact from './blocks/BlockContact.vue'
import BlockCta from './blocks/BlockCta.vue'
import BlockDetails from './blocks/BlockDetails.vue'
import BlockFaq from './blocks/BlockFaq.vue'
import BlockForm from './blocks/BlockForm.vue'
import BlockGallery from './blocks/BlockGallery.vue'
import BlockHero from './blocks/BlockHero.vue'
import BlockImage from './blocks/BlockImage.vue'
import BlockImageText from './blocks/BlockImageText.vue'
import BlockLatestPosts from './blocks/BlockLatestPosts.vue'
import BlockLogos from './blocks/BlockLogos.vue'
import BlockMarquee from './blocks/BlockMarquee.vue'
import BlockProjects from './blocks/BlockProjects.vue'
import BlockQuote from './blocks/BlockQuote.vue'
import BlockReviews from './blocks/BlockReviews.vue'
import BlockServices from './blocks/BlockServices.vue'
import BlockStats from './blocks/BlockStats.vue'
import BlockSteps from './blocks/BlockSteps.vue'
import BlockTeam from './blocks/BlockTeam.vue'
import BlockText from './blocks/BlockText.vue'
import BlockTimeline from './blocks/BlockTimeline.vue'
import BlockVideo from './blocks/BlockVideo.vue'

const props = defineProps<{ block: Block }>()

// Block type → component. Used by the public site, the editor canvas and the Blocks gallery, so they always match.
// Add new types here and in shared/utils/blockTypes.ts.
const registry: Record<string, Component> = {
    hero: BlockHero,
    cta: BlockCta,
    marquee: BlockMarquee,
    text: BlockText,
    imageText: BlockImageText,
    quote: BlockQuote,
    details: BlockDetails,
    projects: BlockProjects,
    gallery: BlockGallery,
    beforeAfter: BlockBeforeAfter,
    services: BlockServices,
    steps: BlockSteps,
    stats: BlockStats,
    logos: BlockLogos,
    timeline: BlockTimeline,
    reviews: BlockReviews,
    team: BlockTeam,
    faq: BlockFaq,
    video: BlockVideo,
    image: BlockImage,
    form: BlockForm,
    contact: BlockContact,
    booking: BlockBooking,
    latestPosts: BlockLatestPosts
}

const preview = inject<boolean>('blockPreview', false)
const p = computed(() => props.block.props as Record<string, string | undefined>)
const classes = computed(() => [
    p.value.sectionBg ? `bg-${p.value.sectionBg}` : '',
    p.value.sectionSpace ? `space-${p.value.sectionSpace}` : ''
])

// Fade-in: only for sections that start below the fold, only on the live site, never with reduced motion
const el = ref<HTMLElement | null>(null)
const reveal = ref<'' | 'reveal-wait' | 'reveal-in'>('')
onMounted(() => {
    if (preview || p.value.sectionReveal !== 'fade' || !el.value || !('IntersectionObserver' in window)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.value.getBoundingClientRect().top < window.innerHeight * 0.9) return
    reveal.value = 'reveal-wait'
    const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
            reveal.value = 'reveal-in'
            io.disconnect()
        }
    }, { rootMargin: '0px 0px -10% 0px' })
    io.observe(el.value)
})
</script>

<template>
    <div v-if="registry[block.type]" :id="p.sectionAnchor || undefined" ref="el" class="sec" :class="[...classes, reveal]" :data-bg="p.sectionBg || undefined">
        <component :is="registry[block.type]" v-bind="block.props" />
    </div>
</template>
