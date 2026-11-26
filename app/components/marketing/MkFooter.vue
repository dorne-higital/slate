<script setup lang="ts">
// Footer for Slate's own site: links every page (it also helps search engines find them all).
const cols = [
    { title: 'Features', pages: [...marketingSections('features'), marketingPage('/pricing')] },
    { title: 'Who it’s for', pages: marketingSections('for') },
    { title: 'Compare', pages: marketingSections('compare') },
    { title: 'Slate', pages: [marketingPage('/guides'), marketingPage('/help'), marketingPage('/about'), marketingPage('/contact'), marketingPage('/privacy'), marketingPage('/terms')] }
]
const year = new Date().getFullYear()
</script>

<template>
    <footer class="mk-foot">
        <div class="mk-wrap">
            <div class="grid">
                <div class="brand">
                    <span class="logo">slate</span>
                    <p>Websites for UK small businesses, built and run from one place.</p>
                    <p>Made in Warrington.<br><a href="mailto:hello@slatecms.co.uk">hello@slatecms.co.uk</a></p>
                </div>
                <nav v-for="c in cols" :key="c.title" :aria-label="c.title">
                    <h2>{{ c.title }}</h2>
                    <NuxtLink v-for="p in c.pages" :key="p.path" :to="p.path">{{ p.navLabel }}</NuxtLink>
                </nav>
            </div>
            <div class="base">
                <span>© {{ year }} Slate</span>
                <span><NuxtLink to="/login">Log in</NuxtLink> · <NuxtLink to="/signup">Start free trial</NuxtLink></span>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.mk-foot { background: var(--quarry); color: #c3c8d1; padding: 72px 0 32px; }
.grid { display: grid; gap: 32px; grid-template-columns: 1.6fr repeat(4, minmax(0, 1fr)); }
.brand p { font-size: 15px; line-height: 1.6; margin: 12px 0 0; max-width: 24em; }
.logo { color: var(--white); font-size: 28px; font-weight: 900; letter-spacing: -.04em; }
nav { display: flex; flex-direction: column; gap: 2px; }
h2 { color: var(--white); font-size: 14px; font-weight: 700; letter-spacing: .04em; margin: 0 0 10px; text-transform: uppercase; }
a { color: #c3c8d1; font-size: 15px; line-height: 1.9; text-decoration: none; }
a:hover { color: var(--white); text-decoration: underline; }
.base { border-top: 1px solid rgb(230 233 238 / 16%); display: flex; flex-wrap: wrap; font-size: 14px; gap: 12px; justify-content: space-between; margin-top: 48px; padding-top: 24px; }
@media (max-width: 960px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .brand { grid-column: 1 / -1; } }
@media (max-width: 480px) { .grid { grid-template-columns: minmax(0, 1fr); } }
</style>
