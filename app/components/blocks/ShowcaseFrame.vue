<script setup lang="ts">
// A picture shown in a phone, a browser window, a photo frame, or on its own. Used by the showcase blocks.
// Its width comes from the parent (set max-width on it); the frame keeps its own shape.
const props = defineProps<{ kind?: string, src?: string, alt?: string, eager?: boolean }>()
const k = computed(() => ['phone', 'browser', 'photo', 'plain'].includes(props.kind ?? '') ? props.kind : 'phone')
</script>

<template>
    <div class="sf" :class="`sf-${k}`">
        <div v-if="k === 'browser'" class="bar" aria-hidden="true"><i /><i /><i /><span /></div>
        <div class="screen">
            <img v-if="src" :src="src" :alt="alt || ''" :loading="eager ? 'eager' : 'lazy'" :fetchpriority="eager ? 'high' : undefined">
            <span v-else class="empty" aria-hidden="true">Picture</span>
        </div>
    </div>
</template>

<style scoped>
.sf { box-sizing: border-box; width: 100%; }
.screen { overflow: hidden; position: relative; }
.screen img { display: block; height: 100%; object-fit: cover; width: 100%; }
.empty { align-items: center; background: var(--site-surface); color: var(--site-muted); display: flex; font-size: 14px; height: 100%; justify-content: center; }

.sf-phone { background: #111; border-radius: 15% / 7.2%; box-shadow: 0 24px 50px rgb(17 20 30 / 22%); padding: 4.2%; }
.sf-phone .screen { aspect-ratio: 9 / 19.5; border-radius: 11.5% / 5.3%; }

.sf-browser { background: #fff; border-radius: 12px; box-shadow: 0 24px 50px rgb(17 20 30 / 18%); overflow: hidden; }
.bar { align-items: center; background: #eceae4; border-bottom: 1px solid #dcd9d1; display: flex; gap: 6px; height: 30px; padding: 0 12px; }
.bar i { background: #c9c5bb; border-radius: 50%; height: 9px; width: 9px; }
.bar span { background: #fff; border-radius: 8px; flex: 1; height: 16px; margin-left: 10px; max-width: 60%; }
.sf-browser .screen { aspect-ratio: 16 / 10; }

.sf-photo .screen { aspect-ratio: 4 / 3; border-radius: var(--site-card-radius, 18px); box-shadow: 0 20px 44px rgb(17 20 30 / 16%); }

.sf-plain .screen { aspect-ratio: 4 / 3; }
.sf-plain .screen img { object-fit: contain; }
</style>
