<script setup lang="ts">
import type { Component } from 'vue'
import BlockBooking from './blocks/BlockBooking.vue'
import BlockCta from './blocks/BlockCta.vue'
import BlockFaq from './blocks/BlockFaq.vue'
import BlockForm from './blocks/BlockForm.vue'
import BlockHero from './blocks/BlockHero.vue'
import BlockImageText from './blocks/BlockImageText.vue'
import BlockLatestPosts from './blocks/BlockLatestPosts.vue'
import BlockReviews from './blocks/BlockReviews.vue'
import BlockServices from './blocks/BlockServices.vue'
import BlockText from './blocks/BlockText.vue'

defineProps<{ block: Block }>()

// Block type → component. Used by both the public site and the editor canvas, so they always match.
// Add new types here and in shared/utils/blockTypes.ts.
const registry: Record<string, Component> = {
    hero: BlockHero,
    text: BlockText,
    imageText: BlockImageText,
    services: BlockServices,
    reviews: BlockReviews,
    faq: BlockFaq,
    cta: BlockCta,
    form: BlockForm,
    latestPosts: BlockLatestPosts,
    booking: BlockBooking
}
</script>

<template>
    <component :is="registry[block.type]" v-if="registry[block.type]" v-bind="block.props" />
</template>
