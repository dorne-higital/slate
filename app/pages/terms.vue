<script setup lang="ts">
useHead({ title: 'Terms of service · Slate' })
useSeoMeta({ description: 'The terms for using Slate: plans, payments, domains, your content and cancelling.' })
const plans = PLANS
</script>

<template>
    <LegalPage title="Terms of service">
        <p>These terms are the agreement between you and Slate when you use slatecms.co.uk, the Slate dashboard and the websites we host. Please read them; by creating an account you agree to them.</p>

        <h2>1. Who we are</h2>
        <p>Slate is run by {{ LEGAL.owner }}, trading as {{ LEGAL.tradingAs }}, based in {{ LEGAL.location }}. Contact us at <a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a>.</p>

        <h2>2. Your account</h2>
        <ul>
            <li>You must be 18 or over and give us accurate details.</li>
            <li>Keep your password safe. You’re responsible for what happens in your account, including what people you invite do.</li>
            <li>Slate is meant for businesses and organisations based in the UK (including the Isle of Man and the Channel Islands). If you’re using it as a consumer, your rights under UK consumer law aren’t affected by anything here.</li>
        </ul>

        <h2>3. Free trial</h2>
        <p>New accounts get a {{ TRIAL_DAYS }}-day free trial with no card needed. When it ends, your website is paused (visitors can’t see it, nothing is deleted) until you choose a plan.</p>

        <h2>4. Plans and payment</h2>
        <ul>
            <li>Plans are paid monthly or yearly in advance, by card, through Stripe: <span v-for="(p, i) in plans" :key="p.key">{{ p.name }} {{ formatPence(p.monthly) }} a month or {{ formatPence(p.yearly) }} a year{{ i < plans.length - 1 ? ', ' : '' }}</span>. Studio includes {{ findPlan('studio')!.limits.sites }} websites; each extra one is {{ formatPence(findPlan('studio')!.limits.extraSiteMonthly!) }} a month.</li>
            <li>We’re not registered for VAT, so no VAT is added.</li>
            <li>Plans renew automatically until you cancel. We may change prices with at least 30 days’ notice by email; the new price applies from your next renewal after that.</li>
            <li>If a payment fails, we’ll email you and try again. If it still isn’t paid, your website may be paused until it is.</li>
            <li>Each plan has limits (pages, forms, people, storage) shown on our pricing table. If you reach one, you’ll be asked to change plan to go further.</li>
            <li>Special prices or discounts we agree with you apply as described when they’re given.</li>
        </ul>

        <h2>5. Cancelling and refunds</h2>
        <ul>
            <li>Cancel any time from Billing. Your plan stays active until the end of the period you’ve paid for, then stops. We don’t refund part-used periods, except where the law requires it.</li>
            <li>Before your plan ends, you can download your website (pages, posts, images and form replies) from Settings.</li>
            <li>If you’re a consumer, you have 14 days from first paying to cancel and get a refund, less a fair amount for the time you’ve used.</li>
        </ul>

        <h2>6. Domains</h2>
        <ul>
            <li>Domains bought through Slate are registered in your name through our registrar partner, paid yearly and renewed automatically until you cancel. Domain fees aren’t refundable once the domain is registered.</li>
            <li>Registration means accepting the rules of the domain’s registry (for example Nominet for .uk). You must give accurate contact details.</li>
            <li>The domain is yours. If you want to move it to another provider, ask us and we’ll help.</li>
            <li>If a domain isn’t renewed it may expire and could be registered by someone else.</li>
            <li>Connecting a domain you already own is free; you stay responsible for paying wherever it’s registered.</li>
        </ul>

        <h2>7. Invoices for extra work</h2>
        <p>If we agree extra work with you, we’ll send an invoice by email with a link to pay by card. It’s due by the date shown on it.</p>

        <h2>8. Your content</h2>
        <ul>
            <li>Your words, images and other content stay yours. You give us permission to store, copy and show them only as needed to run your website and Slate.</li>
            <li>You’re responsible for having the right to use everything you put on your website, and for following the law that applies to it (including privacy law for the information your forms collect, and telling visitors about it).</li>
        </ul>

        <h2>9. What you can’t use Slate for</h2>
        <p>Don’t use Slate for anything illegal, harmful or deceptive, including: phishing or scams; malware; spam; content that infringes others’ rights; sexual content involving minors; content that promotes violence or hatred; or trying to break, overload or get round Slate’s security or limits. We may remove content or pause websites that break these rules, and we’ll tell you why unless the law or safety stops us.</p>

        <h2>10. Information we handle for you</h2>
        <p>For information your website collects from its visitors (such as form replies), you’re the controller and Slate is your processor. We only use it to provide Slate; keep it confidential and secure; use only the providers listed in our <NuxtLink to="/privacy">privacy policy</NuxtLink> (and tell you before adding new ones); help you answer people’s requests about their information; tell you without delay if there’s a security breach affecting it; delete it when you delete it or your website; and give you the information you need to show this is being done.</p>

        <h2>11. Our service</h2>
        <ul>
            <li>We work hard to keep Slate running and backed up, but we can’t promise it will never be interrupted, for example for maintenance or problems with the companies we rely on.</li>
            <li>We may improve or change features. If we remove something important you’re paying for, we’ll tell you in advance.</li>
        </ul>

        <h2>12. Liability</h2>
        <ul>
            <li>Nothing in these terms limits liability for death or personal injury caused by negligence, fraud, or anything else the law doesn’t allow us to limit.</li>
            <li>Otherwise, we’re not liable for lost profits, revenue, business or data you could have backed up, or for indirect losses.</li>
            <li>Our total liability in any 12 months is limited to what you paid Slate in those 12 months.</li>
        </ul>

        <h2>13. Ending the agreement</h2>
        <p>You can delete your account any time from Your account. We can close an account that seriously or repeatedly breaks these terms, or with 60 days’ notice if we stop offering Slate, in which case we’ll refund any unused prepaid time.</p>

        <h2>14. Changes to these terms</h2>
        <p>We may update these terms. We’ll change the date at the top and email account holders about important changes at least 30 days before they take effect.</p>

        <h2>15. Law</h2>
        <p>These terms are governed by the law of England and Wales, and the courts of England and Wales can decide any dispute. If you live in Scotland or Northern Ireland you can also use your local courts.</p>
    </LegalPage>
</template>
