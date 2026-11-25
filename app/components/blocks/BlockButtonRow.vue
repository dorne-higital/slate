<script setup lang="ts">
const props = defineProps<{ align?: string, eyebrow?: string, heading?: string, text?: string, buttonStyle?: string, buttonLabel?: string, buttonUrl?: string, button2Label?: string, button2Url?: string, qr?: string }>()
const centre = computed(() => choice('buttonRow', 'align', props.align) === 'centre')
</script>

<template>
    <section class="blk">
        <div class="blk-inner">
            <div class="blk-head" :class="{ centre }">
                <p v-if="eyebrow" class="blk-eyebrow">{{ eyebrow }}</p>
                <h2 v-if="heading">{{ heading }}</h2>
                <p v-if="text" class="blk-muted">{{ text }}</p>
                <ShowcaseButtons
                    :kind="buttonStyle" :button-label="buttonLabel" :button-url="buttonUrl" :button2-label="button2Label" :button2-url="button2Url"
                    :qr="qr" :align="centre ? 'center' : 'start'"
                />
            </div>
        </div>
    </section>
</template>
