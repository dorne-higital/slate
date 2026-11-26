<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const faqs: FaqItem[] = [
    { q: 'How does the free trial work?', a: `You get ${TRIAL_DAYS} days with everything in the Business plan, and you don’t need a card to start. Choose a plan any time during the trial to keep your site online afterwards.` },
    { q: 'What happens when the trial ends?', a: 'If you haven’t chosen a plan, your site is paused rather than deleted. Pick a plan whenever you’re ready and it comes straight back.' },
    { q: 'Can I change plans later?', a: 'Yes. Move up or down from the Billing page whenever you like.' },
    { q: 'Is there a contract or a cancellation fee?', a: 'No. Cancel from your dashboard at any time. Your site stays online until the end of the period you’ve paid for, and you can download everything first.' },
    { q: 'Do your prices include VAT?', a: 'Slate isn’t registered for VAT, so no VAT is added. The price you see is the price you pay.' },
    { q: 'How much does a domain cost?', a: `Domains bought through Slate are charged yearly, from ${formatPence(Math.min(...Object.values(DOMAIN_PRICES)))} a year. Connecting a domain you already own is free.` },
    { q: 'How do I pay?', a: 'By card, through Stripe. Your receipts and invoices are in the Billing page.' }
]
const page = useMarketingSeo('/pricing', { jsonLd: [pricingJsonLd(), faqJsonLd(faqs)] })
const rows = planRowsFor()
const domains = Object.entries(DOMAIN_PRICES).map(([tld, pence]) => ({ tld: `.${tld}`, price: formatPence(pence) }))
const included = ['Hosting on Cloudflare’s network', 'HTTPS on every address', 'A free slatecms.co.uk address', 'Your own domain', 'The full editor and every block', 'Page history', 'Visitor stats without cookies', 'Site health and SEO tools', 'Spam protection on forms', 'Updates, forever']
</script>

<template>
    <div>
        <section class="top mk-wrap">
            <p class="eyebrow">Pricing</p>
            <h1>{{ page.h1 }}</h1>
            <p class="lead">One monthly price covers your hosting, HTTPS, forms and support. Try everything free for {{ TRIAL_DAYS }} days, with no card needed.</p>
        </section>

        <section class="mk-wrap plans" aria-labelledby="plans-h">
            <h2 id="plans-h" class="visually-hidden">Plans</h2>
            <MkPlans />
        </section>

        <section class="mk-section tint">
            <div class="mk-wrap">
                <div class="mk-head"><h2>Compare the plans</h2></div>
                <div class="scroll" tabindex="0" role="region" aria-label="Plan comparison table">
                    <table class="cmp">
                        <thead>
                            <tr>
                                <th scope="col"><span class="visually-hidden">Feature</span></th>
                                <th v-for="p in PLANS" :key="p.key" scope="col" :class="{ hl: p.key === TRIAL_PLAN }">{{ p.name }}<span>{{ formatPence(p.monthly) }} a month</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in rows" :key="r.label">
                                <th scope="row">{{ r.label }}</th>
                                <td v-for="(v, i) in r.values" :key="i" :class="{ hl: PLANS[i]!.key === TRIAL_PLAN }">{{ v }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        <section class="mk-section">
            <div class="mk-wrap two">
                <div>
                    <div class="mk-head"><h2>Included in every plan</h2></div>
                    <ul class="ticks">
                        <li v-for="i in included" :key="i">{{ i }}</li>
                    </ul>
                </div>
                <div>
                    <div class="mk-head"><h2>Domains</h2><p>Optional, charged yearly, with free email forwarding. Connecting a domain you already own is free.</p></div>
                    <table class="dom">
                        <thead><tr><th scope="col">Ending</th><th scope="col">Per year</th></tr></thead>
                        <tbody><tr v-for="d in domains" :key="d.tld"><td>{{ d.tld }}</td><td>{{ d.price }}</td></tr></tbody>
                    </table>
                </div>
            </div>
        </section>

        <MkFaq :items="faqs" title="Questions about pricing" />
        <MkCta />
    </div>
</template>

<style scoped>
.top { display: flex; flex-direction: column; gap: 18px; padding-bottom: 40px; padding-top: 64px; }
.eyebrow { color: var(--heather); font-size: 15px; font-weight: 700; letter-spacing: .04em; margin: 0; text-transform: uppercase; }
h1 { font-size: clamp(40px, 5.4vw, 64px); font-weight: 900; letter-spacing: -.045em; line-height: 1; margin: 0; max-width: 14em; }
.lead { color: var(--text-body); font-size: 20px; line-height: 1.55; margin: 0; max-width: 36em; }
.plans { padding-bottom: 88px; }
.scroll { overflow-x: auto; }
.cmp { background: var(--white); border-collapse: collapse; border-radius: 10px; box-shadow: 0 0 0 1px var(--line); min-width: 720px; width: 100%; }
.cmp th, .cmp td { border-bottom: 1px solid var(--line-soft); font-size: 15px; padding: 14px 18px; text-align: left; vertical-align: top; }
.cmp thead th { border-bottom: 2px solid var(--quarry); font-size: 18px; vertical-align: bottom; }
.cmp thead th span { color: var(--text-muted); display: block; font-size: 14px; font-weight: 500; }
.cmp tbody th { color: var(--text-muted); font-weight: 600; }
.cmp .hl { background: #fff6e6; }
.two { display: grid; gap: 64px; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.ticks { columns: 2; gap: 24px; list-style: none; margin: 0; padding: 0; }
.ticks li { break-inside: avoid; color: var(--text-body); font-size: 16px; margin-bottom: 12px; padding-left: 28px; position: relative; }
.ticks li::before { border-bottom: 2.4px solid var(--ok); border-left: 2.4px solid var(--ok); content: ''; height: 6px; left: 4px; position: absolute; top: 6px; transform: rotate(-45deg); width: 12px; }
.dom { border-collapse: collapse; width: 100%; }
.dom th, .dom td { border-bottom: 1px solid var(--line); font-size: 16px; padding: 12px 4px; text-align: left; }
.dom td:last-child, .dom th:last-child { text-align: right; }
@media (max-width: 960px) { .two { gap: 40px; grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .ticks { columns: 1; } }
</style>
