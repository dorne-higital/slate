<template>
    <div class="home">
        <section class="home__hero">
            <span class="home__badge">For small sites that shouldn't need a developer</span>
            <h1 class="home__title">The CMS that gets out of your way</h1>
            <p class="home__subtitle">
                Build pages, manage media and collect form submissions from one calm admin panel. No code, no
                plugins to babysit.
            </p>

            <div class="home__cta-row">
                <NuxtLink :to="ctaTo" class="home__cta-primary">{{ ctaLabel }}</NuxtLink>
                <NuxtLink to="/#demo" class="home__cta-secondary">See it in action</NuxtLink>
            </div>

            <p class="home__micro">Free plan available &middot; no credit card required</p>

            <div class="home__browser">
                <div class="home__browser-bar">
                    <span class="home__browser-dot home__browser-dot--primary" />
                    <span class="home__browser-dot home__browser-dot--accent" />
                    <span class="home__browser-dot home__browser-dot--secondary" />
                    <span class="home__browser-url">app.slatecms.com/admin/pages</span>
                </div>
                <div class="home__browser-shot home__browser-shot--hero">
                    <ImageIcon :size="32" :stroke-width="1.5" />
                    <span>Drop a screenshot of the Slate admin panel</span>
                </div>
            </div>
        </section>

        <section id="features" class="home__features">
            <div class="home__section-head">
                <span class="home__eyebrow">Everything you need</span>
                <h2 class="home__section-title">One admin panel, not a stack of plugins</h2>
            </div>

            <div class="home__feature-grid">
                <article v-for="feature in features" :key="feature.title" class="home__feature-card">
                    <div class="home__feature-icon">
                        <component :is="feature.icon" :size="22" :stroke-width="2" />
                    </div>
                    <h3 class="home__feature-title">{{ feature.title }}</h3>
                    <p class="home__feature-desc">{{ feature.desc }}</p>
                </article>
            </div>
        </section>

        <section id="demo" class="home__demo">
            <div class="home__section-head home__section-head--center">
                <span class="home__eyebrow">The page builder</span>
                <h2 class="home__section-title">Drag a block, see it live</h2>
                <p class="home__section-desc">
                    Rearrange sections, swap images and edit copy directly on the page — every change saves as
                    you go.
                </p>
            </div>

            <div class="home__browser home__browser--demo">
                <div class="home__browser-bar">
                    <span class="home__browser-dot home__browser-dot--primary" />
                    <span class="home__browser-dot home__browser-dot--accent" />
                    <span class="home__browser-dot home__browser-dot--secondary" />
                    <span class="home__browser-url">app.slatecms.com/admin/builder</span>
                </div>
                <div class="home__browser-shot home__browser-shot--demo">
                    <ImageIcon :size="32" :stroke-width="1.5" />
                    <span>Drop a screenshot of the page builder</span>
                </div>
            </div>
        </section>

        <section id="pricing" class="home__pricing">
            <div class="home__section-head home__section-head--center">
                <span class="home__eyebrow">Pricing</span>
                <h2 class="home__section-title">Plans that scale with your site</h2>
                <p class="home__section-desc">Start free. Upgrade when you outgrow it.</p>
            </div>

            <div class="home__billing-toggle" role="group" aria-label="Billing interval">
                <button
                    type="button"
                    class="home__billing-btn"
                    :class="{ 'home__billing-btn--active': billing === 'monthly' }"
                    @click="billing = 'monthly'"
                >
                    Monthly
                </button>
                <button
                    type="button"
                    class="home__billing-btn"
                    :class="{ 'home__billing-btn--active': billing === 'annual' }"
                    @click="billing = 'annual'"
                >
                    Annual
                    <span class="home__billing-badge">-20%</span>
                </button>
            </div>

            <div class="home__tiers">
                <article v-for="tier in tiers" :key="tier.key" class="home__tier" :class="{ 'home__tier--highlight': tier.popular }">
                    <p v-if="tier.popular" class="home__tier-popular">Most popular</p>

                    <div class="home__tier-head">
                        <h3 class="home__tier-name">{{ tier.name }}</h3>
                        <p class="home__tier-tagline">{{ tier.tagline }}</p>
                    </div>

                    <p class="home__tier-price">
                        <span class="home__tier-price-amount">{{ tier.price }}</span>
                        <span class="home__tier-price-suffix">{{ tier.priceSuffix }}</span>
                    </p>

                    <NuxtLink :to="tier.buttonLabel === 'Talk to sales' ? '/contact' : ctaTo" class="home__tier-button" :class="`home__tier-button--${tier.buttonVariant}`">
                        {{ tier.buttonLabel }}
                    </NuxtLink>

                    <ul class="home__tier-perks">
                        <li v-for="perk in tier.perks" :key="perk">
                            <Check :size="16" :stroke-width="3" class="home__tier-check" />
                            <span>{{ perk }}</span>
                        </li>
                    </ul>
                </article>
            </div>
        </section>

        <section class="home__closing">
            <div class="home__closing-panel">
                <h2 class="home__closing-title">Ready to build your site?</h2>
                <p class="home__closing-subtitle">Set up your admin panel in minutes. Cancel any time.</p>
                <NuxtLink :to="ctaTo" class="home__closing-cta">{{ ctaLabel }}</NuxtLink>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { Check, FileText, Globe, Image as ImageIcon, LayoutTemplate, ShieldCheck, Users } from 'lucide-vue-next'
import type { PlanTier } from '../utils/planTiers'

definePageMeta({ layout: 'marketing', public: true })

const user = useSupabaseUser()
const ctaLabel = computed(() => (user.value ? 'Dashboard' : 'Get started'))
const ctaTo = ref('/register')

if (user.value) {
    const { isPlatformAdmin, siteIds } = await useCurrentAccess()
    ctaTo.value = isPlatformAdmin ? '/admin' : (siteIds[0] ? `/sites/${siteIds[0]}` : '/login')
}

const features = [
    { icon: LayoutTemplate, title: 'Drag-and-drop builder', desc: 'Rearrange sections and edit copy right on the page. No preview step, no publish delay.' },
    { icon: ImageIcon, title: 'Media library', desc: 'Upload once, reuse everywhere. Automatic resizing keeps pages fast.' },
    { icon: FileText, title: 'Forms & submissions', desc: 'Add a contact or signup form in a click. Replies land in your inbox.' },
    { icon: Globe, title: 'Custom domains', desc: 'Point your own domain at your site. SSL is handled for you.' },
    { icon: Users, title: 'Roles & permissions', desc: 'Invite editors without handing over the keys to billing or settings.' },
    { icon: ShieldCheck, title: 'Fast, secure hosting', desc: 'Every page ships from a global CDN with automatic backups.' }
]

const billing = ref<'monthly' | 'annual'>('monthly')

const TIER_DETAILS: Record<PlanTier['key'], { buttonLabel: string, buttonVariant: 'primary' | 'secondary', popular: boolean, perks: string[] }> = {
    free: {
        buttonLabel: 'Get started',
        buttonVariant: 'secondary',
        popular: false,
        perks: ['1 site', 'Up to 3 pages', '1 form, 20 submissions/mo', '50 media uploads', 'Slate branding', 'Community support']
    },
    pro: {
        buttonLabel: 'Get started',
        buttonVariant: 'primary',
        popular: true,
        perks: ['1 site', 'Unlimited pages', '5 forms, unlimited submissions', '500 media uploads', 'Custom domain', 'Remove Slate branding', 'Email support']
    },
    business: {
        buttonLabel: 'Talk to sales',
        buttonVariant: 'secondary',
        popular: false,
        perks: ['1 site', 'Unlimited pages', 'Unlimited forms & submissions', 'Unlimited media uploads', 'Custom domain', '3 team seats & roles', 'Staging environment', 'Priority support']
    }
}

const tiers = computed(() => {
    const annual = billing.value === 'annual'

    return PLAN_TIERS.map(tier => ({
        ...tier,
        ...TIER_DETAILS[tier.key],
        price: annual ? tier.priceAnnual : tier.priceMonthly,
        priceSuffix: tier.key === 'free' ? 'forever' : (annual ? '/mo, billed yearly' : '/mo')
    }))
})
</script>

<style lang="scss" scoped>
.home {
    font-family: $font-quicksand;

    &__eyebrow {
        color: $color-primary;
        font-size: $text-eyebrow;
        font-weight: 700;
        letter-spacing: $tracking-wide;
        text-transform: uppercase;
    }

    &__badge {
        background: $color-surface-active;
        border-radius: $radius-pill;
        color: $color-primary;
        font-size: $text-small;
        font-weight: 600;
        padding: $space-xs $space-md;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
        }
    }

    &__hero {
        align-items: center;
        display: flex;
        flex-direction: column;
        gap: $space-lg;
        margin: 0 auto;
        max-width: $container-xl;
        padding: $space-2xl $space-lg $space-xl;
        text-align: center;
    }

    &__title {
        font-family: $font-quicksand;
        font-size: $text-hero;
        font-weight: 700;
        line-height: $leading-tight;
        margin: 0;
        max-width: 820px;
    }

    &__subtitle {
        color: $color-text-muted;
        font-size: 1.125rem;
        line-height: $leading-normal;
        margin: 0;
        max-width: 560px;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__cta-row {
        display: flex;
        flex-wrap: wrap;
        gap: $space-sm;
        justify-content: center;
    }

    &__cta-primary,
    &__closing-cta {
        background: $color-primary;
        border-radius: $radius-pill;
        color: $color-primary-contrast;
        font-weight: 600;
        padding: $space-sm $space-lg;
        text-decoration: none;
        transition:
            box-shadow $transition-base,
            transform $transition-base;

        &:hover {
            box-shadow: $shadow-md;
            transform: translateY(-2px);
        }

        &:active {
            transform: scale(0.96);
        }

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;

            &:hover {
                box-shadow: $shadow-md-dark;
            }
        }
    }

    &__cta-secondary {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-pill;
        color: $color-text;
        font-weight: 600;
        padding: $space-sm $space-lg;
        text-decoration: none;
        transition:
            border-color $transition-base,
            transform $transition-base;

        &:hover {
            border-color: $color-primary;
            transform: translateY(-2px);
        }

        &:active {
            transform: scale(0.96);
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            color: $color-text-dark;

            &:hover {
                border-color: $color-primary-dark;
            }
        }
    }

    &__micro {
        color: $color-text-subtle;
        font-size: $text-small;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }

    &__browser {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-marketing-lg;
        box-shadow: $shadow-lg;
        margin-top: $space-lg;
        max-width: 980px;
        overflow: hidden;
        width: 100%;

        &--demo {
            box-shadow: $shadow-md;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;

            &--demo {
                box-shadow: $shadow-md-dark;
            }
        }
    }

    &__browser-bar {
        align-items: center;
        background: $color-surface;
        border-bottom: 1px solid $color-border;
        display: flex;
        gap: $space-2xs;
        padding: $space-sm $space-md;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
        }
    }

    &__browser-dot {
        border-radius: 50%;
        height: 11px;
        width: 11px;

        &--primary {
            background: $color-surface-active;
        }

        &--accent {
            background: $color-accent-soft;
        }

        &--secondary {
            background: $color-secondary-soft;
        }

        @media (prefers-color-scheme: dark) {
            &--primary {
                background: $color-surface-active-dark;
            }

            &--accent {
                background: $color-accent-soft-dark;
            }

            &--secondary {
                background: $color-secondary-soft-dark;
            }
        }
    }

    &__browser-url {
        color: $color-text-subtle;
        font-size: $text-micro;
        font-weight: 600;
        margin-left: $space-sm;

        @media (prefers-color-scheme: dark) {
            color: $color-text-subtle-dark;
        }
    }

    &__browser-shot {
        align-items: center;
        border: 1px dashed $color-border;
        color: $color-text-subtle;
        display: flex;
        flex-direction: column;
        font-size: $text-small;
        gap: $space-sm;
        justify-content: center;
        margin: $space-sm;

        &--hero {
            height: 520px;
        }

        &--demo {
            height: 480px;
        }

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;
            color: $color-text-subtle-dark;
        }
    }

    &__section-head {
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        max-width: 620px;

        &--center {
            align-items: center;
            margin: 0 auto;
            text-align: center;
        }
    }

    &__section-title {
        font-size: $text-h1;
        font-weight: 700;
        margin: 0;
    }

    &__section-desc {
        color: $color-text-muted;
        font-size: 1.0625rem;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__features,
    &__demo,
    &__pricing {
        display: flex;
        flex-direction: column;
        gap: $space-xl;
        margin: 0 auto;
        max-width: $container-xl;
        padding: $space-2xl $space-lg;
    }

    &__demo,
    &__pricing {
        align-items: center;
    }

    &__feature-grid {
        display: grid;
        gap: $space-lg;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    }

    &__feature-card {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-marketing-lg;
        box-shadow: $shadow-sm;
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        padding: $space-lg;
        transition:
            border-color $transition-base,
            box-shadow $transition-base,
            transform $transition-base;

        &:hover {
            border-color: $color-border-strong;
            box-shadow: $shadow-lg;
            transform: translateY(-3px);
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            box-shadow: $shadow-sm-dark;

            &:hover {
                border-color: $color-border-strong-dark;
                box-shadow: $shadow-lg-dark;
            }
        }
    }

    &__feature-icon {
        align-items: center;
        background: $color-surface-active;
        border-radius: $radius-marketing-md;
        color: $color-primary;
        display: flex;
        height: 44px;
        justify-content: center;
        width: 44px;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
            color: $color-primary-dark;
        }
    }

    &__feature-title {
        font-size: $text-h4;
        font-weight: 700;
        margin: 0;
    }

    &__feature-desc {
        color: $color-text-muted;
        font-size: $text-small;
        line-height: $leading-normal;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__billing-toggle {
        background: $color-surface;
        border: 1px solid $color-border;
        border-radius: $radius-pill;
        display: inline-flex;
        gap: 2px;
        padding: 4px;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-dark;
            border-color: $color-border-dark;
        }
    }

    &__billing-btn {
        align-items: center;
        background: transparent;
        border: none;
        border-radius: $radius-pill;
        color: $color-text-muted;
        cursor: pointer;
        display: flex;
        font-family: $font-quicksand;
        font-size: $text-small;
        font-weight: 600;
        gap: $space-2xs;
        padding: $space-xs $space-md;
        transition:
            background $transition-base,
            color $transition-base;

        &--active {
            background: $color-surface-raised;
            box-shadow: $shadow-sm;
            color: $color-text;
        }

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;

            &--active {
                background: $color-surface-raised-dark;
                box-shadow: $shadow-sm-dark;
                color: $color-text-dark;
            }
        }
    }

    &__billing-badge {
        background: $color-success-bg;
        border-radius: $radius-pill;
        color: $color-success;
        font-size: $text-micro;
        font-weight: 700;
        padding: 0.125rem 0.4rem;

        @media (prefers-color-scheme: dark) {
            background: $color-success-bg-dark;
            color: $color-success-dark;
        }
    }

    &__tiers {
        align-items: stretch;
        display: grid;
        gap: $space-lg;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        max-width: $container-lg;
        width: 100%;
    }

    &__tier {
        background: $color-surface-raised;
        border: 1px solid $color-border;
        border-radius: $radius-marketing-lg;
        box-shadow: $shadow-sm;
        display: flex;
        flex-direction: column;
        gap: $space-lg;
        padding: $space-lg;
        position: relative;

        &--highlight {
            border-color: $color-primary;
            box-shadow: $shadow-md;
        }

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            border-color: $color-border-dark;
            box-shadow: $shadow-sm-dark;

            &--highlight {
                border-color: $color-primary-dark;
                box-shadow: $shadow-md-dark;
            }
        }
    }

    &__tier-popular {
        background: $color-surface-active;
        border-radius: $radius-pill;
        color: $color-primary;
        font-size: $text-eyebrow;
        font-weight: 700;
        left: 50%;
        margin: 0;
        padding: 0.25rem $space-sm;
        position: absolute;
        top: -13px;
        transform: translateX(-50%);

        @media (prefers-color-scheme: dark) {
            background: $color-surface-active-dark;
            color: $color-primary-dark;
        }
    }

    &__tier-head {
        display: flex;
        flex-direction: column;
        gap: $space-2xs;
    }

    &__tier-name {
        font-size: $text-h3;
        font-weight: 700;
        margin: 0;
    }

    &__tier-tagline {
        color: $color-text-muted;
        font-size: $text-small;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-text-muted-dark;
        }
    }

    &__tier-price {
        align-items: baseline;
        display: flex;
        gap: 0.35rem;
        margin: 0;

        &-amount {
            font-family: $font-baloo;
            font-size: $text-h1;
            font-weight: 700;
        }

        &-suffix {
            color: $color-text-subtle;
            font-size: $text-small;

            @media (prefers-color-scheme: dark) {
                color: $color-text-subtle-dark;
            }
        }
    }

    &__tier-button {
        border-radius: $radius-pill;
        font-weight: 600;
        padding: $space-sm;
        text-align: center;
        text-decoration: none;
        transition:
            box-shadow $transition-base,
            transform $transition-base,
            border-color $transition-base;

        &--primary {
            background: $color-primary;
            color: $color-primary-contrast;

            &:hover {
                box-shadow: $shadow-md;
                transform: translateY(-2px);
            }

            @media (prefers-color-scheme: dark) {
                color: $color-primary-contrast-dark;

                &:hover {
                    box-shadow: $shadow-md-dark;
                }
            }
        }

        &--secondary {
            background: $color-surface-raised;
            border: 1px solid $color-border;
            color: $color-text;

            &:hover {
                border-color: $color-primary;
                transform: translateY(-2px);
            }

            @media (prefers-color-scheme: dark) {
                background: $color-surface-raised-dark;
                border-color: $color-border-dark;
                color: $color-text-dark;

                &:hover {
                    border-color: $color-primary-dark;
                }
            }
        }

        &:active {
            transform: scale(0.96);
        }
    }

    &__tier-perks {
        border-top: 1px solid $color-border;
        display: flex;
        flex-direction: column;
        gap: $space-sm;
        list-style: none;
        margin: 0;
        padding: $space-md 0 0;

        li {
            align-items: flex-start;
            color: $color-text;
            display: flex;
            font-size: $text-small;
            gap: $space-xs;
        }

        @media (prefers-color-scheme: dark) {
            border-color: $color-border-dark;

            li {
                color: $color-text-dark;
            }
        }
    }

    &__tier-check {
        color: $color-success;
        flex-shrink: 0;
        margin-top: 2px;

        @media (prefers-color-scheme: dark) {
            color: $color-success-dark;
        }
    }

    &__closing {
        padding: $space-2xl $space-lg;
    }

    &__closing-panel {
        align-items: center;
        background: $color-primary;
        border-radius: $radius-marketing-lg;
        display: flex;
        flex-direction: column;
        gap: $space-md;
        margin: 0 auto;
        max-width: $container-lg;
        padding: $space-2xl $space-lg;
        text-align: center;

        @media (prefers-color-scheme: dark) {
            background: $color-primary-dark;
        }
    }

    &__closing-title {
        color: $color-primary-contrast;
        font-size: $text-h1;
        font-weight: 700;
        margin: 0;

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__closing-subtitle {
        color: $color-primary-contrast;
        font-size: 1.0625rem;
        margin: 0;
        opacity: 0.9;

        @media (prefers-color-scheme: dark) {
            color: $color-primary-contrast-dark;
        }
    }

    &__closing-cta {
        background: $color-surface-raised;
        color: $color-primary;

        @media (prefers-color-scheme: dark) {
            background: $color-surface-raised-dark;
            color: $color-primary-dark;
        }
    }
}
</style>
