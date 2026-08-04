<template>
    <div class="about">
        <section class="about__hero">
            <p class="about__eyebrow">About</p>
            <h1 class="about__title">About Slate</h1>
            <p class="about__subtitle">
                Slate is a self-hosted, multi-tenant CMS built so agencies and freelancers can run every client's
                site from one dashboard, instead of standing up a separate install, database and server for each
                new client. One deployment, one place to log in, as many sites as you manage.
            </p>
        </section>

        <section class="about__story" aria-labelledby="about-story-title">
            <h2 id="about-story-title" class="about__story-title">Our story</h2>
            <p class="about__story-paragraph">
                Slate started as an internal tool, built by a small team who were tired of re-deploying the same
                CMS stack every time they picked up a new client. Each new site meant a new install to patch, a
                new set of credentials to track down, and a new place for something to quietly break. [Founded in
                a small agency's evenings-and-weekends project], Slate was the fix: one system, one login, every
                client's content in one place.
            </p>
            <p class="about__story-paragraph">
                What began as a way to keep our own client work sane turned into something we thought other
                agencies and freelancers could use too. [We opened it up to other teams in year X], and it's been
                shaped since then by the day-to-day realities of running client sites at scale — access control
                that actually holds up, no per-site reinstalls, and infrastructure you own rather than rent.
            </p>
        </section>

        <section class="about__values" aria-labelledby="about-values-title">
            <h2 id="about-values-title" class="about__values-title">What we believe</h2>

            <div class="about__values-grid">
                <article class="about__value-card">
                    <h3 class="about__value-name">Self-hosted by default</h3>
                    <p class="about__value-description">
                        Slate runs on infrastructure you control. There's no vendor lock-in and no third party
                        holding your clients' content hostage — you deploy it, you own it.
                    </p>
                </article>

                <article class="about__value-card">
                    <h3 class="about__value-name">Real access control</h3>
                    <p class="about__value-description">
                        Every site's data is isolated with row-level security at the database layer, not just
                        checked in application code. Team members and clients only ever see the sites they belong
                        to.
                    </p>
                </article>

                <article class="about__value-card">
                    <h3 class="about__value-name">No per-site reinstall</h3>
                    <p class="about__value-description">
                        Onboard a new client by creating a site inside your existing dashboard, not by
                        provisioning a new server. One deployment scales to every site you add.
                    </p>
                </article>

                <article class="about__value-card">
                    <h3 class="about__value-name">Your data, your infrastructure</h3>
                    <p class="about__value-description">
                        Nothing about your clients' content lives in a system you don't control. Back it up, move
                        it, or export it on your own terms, whenever you need to.
                    </p>
                </article>
            </div>
        </section>

        <section class="about__team" aria-labelledby="about-team-title">
            <h2 id="about-team-title" class="about__team-title">The team</h2>

            <div class="about__team-grid">
                <article class="about__team-card">
                    <div class="about__team-avatar" aria-hidden="true" />
                    <p class="about__team-name">[Name]</p>
                    <p class="about__team-role">[Role]</p>
                </article>

                <article class="about__team-card">
                    <div class="about__team-avatar" aria-hidden="true" />
                    <p class="about__team-name">[Name]</p>
                    <p class="about__team-role">[Role]</p>
                </article>

                <article class="about__team-card">
                    <div class="about__team-avatar" aria-hidden="true" />
                    <p class="about__team-name">[Name]</p>
                    <p class="about__team-role">[Role]</p>
                </article>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'marketing', public: true })
</script>

<style lang="scss" scoped>
.about {
    margin: 0 auto;
    max-width: 72rem;
    padding: $space-7 $space-6 $space-8;

    &__hero {
        margin: 0 auto $space-8;
        max-width: 36rem;
        text-align: center;
    }

    &__eyebrow {
        @include eyebrow;

        margin: 0;
    }

    &__title {
        @include heading-font;

        font-size: $font-size-2xl;
        margin: $space-2 0;
    }

    &__subtitle {
        color: $color-text-muted;
        margin: 0;
    }

    &__story {
        margin: 0 auto $space-8;
        max-width: 42rem;
    }

    &__story-title {
        @include heading-font;

        font-size: $font-size-xl;
        margin: 0 0 $space-5;
        text-align: center;
    }

    &__story-paragraph {
        color: $color-text-muted;
        margin: 0 0 $space-4;

        &:last-child {
            margin-bottom: 0;
        }
    }

    &__values {
        margin: 0 0 $space-8;
    }

    &__values-title {
        @include heading-font;

        font-size: $font-size-xl;
        margin: 0 0 $space-5;
        text-align: center;
    }

    &__values-grid {
        display: grid;
        gap: $space-5;
        grid-template-columns: repeat(1, minmax(0, 1fr));

        @media (width >= 700px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    &__value-card {
        @include card;
    }

    &__value-name {
        @include heading-font;

        font-size: $font-size-lg;
        margin: 0 0 $space-2;
    }

    &__value-description {
        color: $color-text-muted;
        margin: 0;
    }

    &__team {
        margin: 0;
    }

    &__team-title {
        @include heading-font;

        font-size: $font-size-xl;
        margin: 0 0 $space-5;
        text-align: center;
    }

    &__team-grid {
        display: grid;
        gap: $space-5;
        grid-template-columns: repeat(1, minmax(0, 1fr));

        @media (width >= 700px) {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }
    }

    &__team-card {
        @include card;

        align-items: center;
        display: flex;
        flex-direction: column;
        text-align: center;
    }

    &__team-avatar {
        background: $color-border;
        border-radius: 50%;
        height: 4.5rem;
        margin: 0 0 $space-4;
        width: 4.5rem;

        @media (prefers-color-scheme: dark) {
            background: $color-border-dark;
        }
    }

    &__team-name {
        color: $color-text;
        font-weight: 700;
        margin: 0 0 $space-1;

        @media (prefers-color-scheme: dark) {
            color: $color-text-dark;
        }
    }

    &__team-role {
        color: $color-text-muted;
        margin: 0;
    }
}
</style>
