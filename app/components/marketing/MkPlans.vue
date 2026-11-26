<script setup lang="ts">
// Plan cards, straight from shared/utils/plans.ts. Shows monthly prices until someone picks yearly.
defineProps<{ compact?: boolean }>()
const yearly = ref(false)
const cards = computed(() => PLANS.map(p => ({
    key: p.key,
    name: p.name,
    tagline: p.tagline,
    price: formatPence(yearly.value ? p.yearly : p.monthly),
    per: yearly.value ? 'a year' : 'a month',
    note: yearly.value ? `Two months free compared with paying monthly` : `Or ${formatPence(p.yearly)} a year, two months free`,
    features: planFeatures(p),
    highlight: p.key === TRIAL_PLAN
})))
</script>

<template>
    <div class="mk-plans">
        <div class="toggle" role="group" aria-label="Billing period">
            <button type="button" :aria-pressed="!yearly" @click="yearly = false">Monthly</button>
            <button type="button" :aria-pressed="yearly" @click="yearly = true">Yearly</button>
        </div>
        <ul class="cards">
            <li v-for="c in cards" :key="c.key" :class="{ hl: c.highlight }">
                <span v-if="c.highlight" class="pick">Most popular</span>
                <h3>{{ c.name }}</h3>
                <p class="tag">{{ c.tagline }}</p>
                <p class="price">{{ c.price }} <span>{{ c.per }}</span></p>
                <p class="note">{{ c.note }}</p>
                <NuxtLink class="btn btn-xl" :class="c.highlight ? 'btn-lichen' : 'btn-dark'" to="/signup">Start free trial</NuxtLink>
                <ul v-if="!compact" class="feat">
                    <li v-for="f in c.features" :key="f">{{ f }}</li>
                </ul>
            </li>
        </ul>
        <p class="vat">Prices include everything: hosting, HTTPS, support and updates. No VAT is added.</p>
    </div>
</template>

<style scoped>
.mk-plans { display: flex; flex-direction: column; gap: 24px; }
.toggle { align-self: flex-start; background: var(--mist); border-radius: 999px; display: flex; gap: 2px; padding: 4px; }
.toggle button { background: none; border: 0; border-radius: 999px; color: var(--quarry); cursor: pointer; font: inherit; font-size: 15px; font-weight: 600; padding: 8px 18px; }
.toggle button[aria-pressed='true'] { background: var(--white); box-shadow: 0 1px 3px rgb(46 52 69 / 18%); }
.cards { display: grid; gap: 20px; grid-template-columns: repeat(3, minmax(0, 1fr)); list-style: none; margin: 0; padding: 0; }
.cards > li { background: var(--white); border-radius: 12px; box-shadow: 0 0 0 1px var(--line); display: flex; flex-direction: column; gap: 10px; padding: 28px; position: relative; }
.cards > li.hl { box-shadow: 0 0 0 2px var(--quarry), 5px 5px 0 var(--lichen); }
.pick { background: var(--lichen); border-radius: 999px; color: var(--quarry); font-size: 12.5px; font-weight: 800; padding: 4px 10px; position: absolute; right: 20px; top: -13px; }
h3 { font-size: 22px; margin: 0; }
.tag { color: var(--text-muted); font-size: 15px; margin: 0; }
.price { font-size: 44px; font-weight: 900; letter-spacing: -.03em; margin: 8px 0 0; }
.price span { color: var(--text-muted); font-size: 16px; font-weight: 500; letter-spacing: 0; }
.note { color: var(--text-muted); font-size: 14px; margin: 0 0 8px; }
.btn-dark { background: var(--quarry); color: var(--white); }
.btn-dark:hover { background: var(--heather); }
.feat { border-top: 1px solid var(--line-soft); display: flex; flex-direction: column; gap: 8px; list-style: none; margin: 10px 0 0; padding: 18px 0 0; }
.feat li { color: var(--text-body); font-size: 15px; padding-left: 26px; position: relative; }
.feat li::before { border-bottom: 2px solid var(--ok); border-left: 2px solid var(--ok); content: ''; height: 5px; left: 3px; position: absolute; top: 6px; transform: rotate(-45deg); width: 10px; }
.vat { color: var(--text-muted); font-size: 14px; margin: 0; }
@media (max-width: 960px) { .cards { grid-template-columns: minmax(0, 1fr); max-width: 520px; } }
</style>
