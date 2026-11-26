<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const endings = DOMAIN_TLDS.map(t => `.${t}`).join(', ')
const sections = [
    { eyebrow: 'Buy a domain', title: 'Search, buy and you’re connected', text: `Search for a domain inside Slate and buy it in a couple of clicks. It’s connected to your site straight away, with HTTPS set up for you. Available endings: ${endings}.`, points: ['Clear yearly prices, shown before you buy', 'Renews automatically while your plan is active', 'No DNS settings to touch'], video: 'domains', videoCaption: 'Buying a domain and setting up email forwarding.' },
    { eyebrow: 'Already have one?', title: 'Keep your domain where it is', text: 'If you already own a domain, keep it with whoever you bought it from. Slate shows you exactly which records to add, checks them for you, and tells you the moment it’s working.', points: ['Step-by-step instructions for your provider', 'HTTPS certificates set up and renewed for you', 'Works with or without “www”'] },
    { eyebrow: 'Email', title: 'hello@yourbusiness.co.uk, into the inbox you already use', text: 'Domains bought through Slate come with free email forwarding. Set up addresses like hello@ or bookings@ and messages arrive in your Gmail, Outlook or any inbox you already have.', points: ['Addresses like hello@, bookings@ and accounts@', 'No extra mailbox to check or pay for', 'Change where they go at any time'] }
]
const faqs: FaqItem[] = [
    { q: 'Do I have to buy a domain through Slate?', a: 'No. You can connect a domain you already own, wherever it’s registered. Buying through Slate just means there’s nothing to set up.' },
    { q: 'Can I reply from my business address?', a: 'Forwarding brings messages into your existing inbox. To reply from your business address, most email providers, including Gmail, let you add it as a “send mail as” address.' },
    { q: 'What happens to my domain if I leave Slate?', a: 'It’s yours. You can move it to another registrar, and we’ll give you what you need to transfer it.' },
    { q: 'Is my site secure?', a: 'Yes. Every address, free or your own, is served over HTTPS, and the certificates renew automatically.' }
]
</script>

<template>
    <MkFeaturePage
        path="/features/domains-and-email"
        eyebrow="Domains and email"
        lead="Buy a domain inside Slate or connect one you already own. HTTPS is set up for you, and free email forwarding means hello@yourbusiness.co.uk lands in the inbox you already use."
        video="domains"
        video-caption="Buying a domain and adding an email address."
        :sections="sections"
        :faqs="faqs"
    />
</template>
