<script setup lang="ts">
useHead({ title: 'Privacy policy · Slate' })
useSeoMeta({ description: 'How Slate collects, uses and protects personal information.' })
</script>

<template>
    <LegalPage title="Privacy policy">
        <p>This policy explains what personal information Slate collects, why, who it’s shared with, how long it’s kept and your rights. It covers slatecms.co.uk, the Slate dashboard, and the websites Slate hosts for its customers.</p>

        <h2>Who we are</h2>
        <p>Slate is run by {{ LEGAL.owner }}, trading as {{ LEGAL.tradingAs }}, based in {{ LEGAL.location }}. For anything in this policy, email <a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a>.</p>
        <p v-if="LEGAL.icoNumber">We’re registered with the Information Commissioner’s Office (ICO), registration number {{ LEGAL.icoNumber }}.</p>
        <p v-else>Our registration with the Information Commissioner’s Office (ICO) is being processed.</p>

        <h2>Two roles</h2>
        <ul>
            <li><b>For people who use Slate</b> (account holders and their team members), we decide what information is collected and how it’s used. We’re the “controller”.</li>
            <li><b>For visitors to our customers’ websites</b>, the business that owns the website decides what it collects, for example through its contact forms. That business is the controller and Slate only stores and processes the information for them, as their “processor”. If you sent a form on one of those websites, contact the business first. We’ll help them respond.</li>
        </ul>

        <h2>What we collect from people who use Slate</h2>
        <table>
            <thead><tr><th scope="col">Information</th><th scope="col">Why</th><th scope="col">Lawful basis</th></tr></thead>
            <tbody>
                <tr><td>Name, email address and password (stored only as a secure scrambled “hash”)</td><td>To create your account and log you in</td><td>Contract</td></tr>
                <tr><td>Your website content: pages, posts, images, menus, settings</td><td>To build and host your website</td><td>Contract</td></tr>
                <tr><td>Billing details: name, address, any tax ID, plan and invoices. Card details go straight to Stripe; we never see or store them.</td><td>To take payment for plans, domains and invoices</td><td>Contract; legal obligation (keeping accounting records)</td></tr>
                <tr><td>Domain registration details: name, address, email and phone</td><td>Domain registries require them to register a domain in your name</td><td>Contract</td></tr>
                <tr><td>Support messages</td><td>To help you</td><td>Contract; legitimate interests</td></tr>
                <tr><td>Technical information: IP address, browser, pages requested, errors</td><td>To keep Slate secure, stop abuse and fix problems</td><td>Legitimate interests</td></tr>
            </tbody>
        </table>

        <h2>What Slate stores for our customers’ websites</h2>
        <ul>
            <li><b>Form replies</b> that visitors send through a website’s forms, plus the page they were sent from. To stop spam we keep a one-way scrambled code made from the sender’s IP address, never the address itself.</li>
            <li><b>Basic request information</b> (IP address, browser) that every web server sees, used to deliver the page and protect against attacks.</li>
            <li>Website owners can add their own tools, such as Google Analytics, the Meta Pixel or Calendly. Those that set tracking cookies only load after the visitor agrees in the cookie banner. Those tools are run by their providers under their own privacy policies.</li>
        </ul>

        <h2>Cookies</h2>
        <p>On slatecms.co.uk and the Slate dashboard we use only the cookies needed to keep you logged in and secure. We don’t use advertising or tracking cookies. Our bot check (Cloudflare Turnstile) runs on the sign-up, login and password reset pages to stop automated abuse.</p>

        <h2>Who we share information with</h2>
        <p>We use these companies to run Slate. Each only gets what it needs for its job, under a contract that requires it to protect the information.</p>
        <table>
            <thead><tr><th scope="col">Company</th><th scope="col">What for</th><th scope="col">Where</th></tr></thead>
            <tbody>
                <tr><td>Cloudflare</td><td>Hosting, security, file storage, bot checks, custom domains</td><td>Worldwide network; stored files in the EU or US</td></tr>
                <tr><td>Neon</td><td>Our database</td><td>London, UK</td></tr>
                <tr><td>Stripe</td><td>Payments and invoices</td><td>UK, EU and US</td></tr>
                <tr><td>Resend</td><td>Sending emails (sign-up, password resets, form notifications, invoices)</td><td>EU (Ireland) and US</td></tr>
                <tr><td>name.com</td><td>Registering domains bought through Slate. Registration details are passed to the domain registry (e.g. Nominet for .uk) as the rules require.</td><td>US</td></tr>
                <tr><td>Google Fonts</td><td>Website lettering. A visitor’s browser fetches fonts from Google, which sees their IP address.</td><td>Worldwide</td></tr>
            </tbody>
        </table>
        <p>Where information goes outside the UK, it’s protected by the UK’s adequacy rules or by the standard contract clauses approved for international transfers. We never sell personal information, and we only share it with others if the law requires us to.</p>

        <h2>How long we keep it</h2>
        <ul>
            <li><b>Your account and websites:</b> while you have an account. If you delete a website, we keep it for 30 days so you can change your mind, then delete it for good.</li>
            <li><b>Deleting your account</b> removes your login and personal details straight away (sites shared with other people stay with them).</li>
            <li><b>Invoices and payment records:</b> 6 years, because UK tax law requires it.</li>
            <li><b>Form replies:</b> until the website owner deletes them or their website.</li>
            <li><b>Backups:</b> copies of the database are kept for about 4 weeks, then overwritten.</li>
            <li><b>Error logs:</b> 30 days.</li>
        </ul>

        <h2>Keeping it safe</h2>
        <p>Everything is sent over encrypted connections (HTTPS). Passwords are stored only as hashes. Every request is checked so one account can never see another’s information. Access to our systems is limited to the people who run Slate.</p>

        <h2>Your rights</h2>
        <p>You can ask us to:</p>
        <ul>
            <li>give you a copy of your information (you can also download your website any time from Settings),</li>
            <li>correct it,</li>
            <li>delete it (you can delete your account yourself from Your account),</li>
            <li>limit or object to how we use it, or</li>
            <li>send it to another company.</li>
        </ul>
        <p>Email <a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a> and we’ll reply within a month. If you’re unhappy with how we’ve handled your information, you can complain to the ICO at <a href="https://ico.org.uk/make-a-complaint/" rel="noopener">ico.org.uk/make-a-complaint</a>, though we’d like the chance to put it right first.</p>

        <h2>Children</h2>
        <p>Slate is for businesses and isn’t meant for anyone under 18.</p>

        <h2>Changes</h2>
        <p>If we change this policy we’ll update the date at the top, and email account holders about anything important.</p>
    </LegalPage>
</template>
