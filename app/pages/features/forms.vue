<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const sections = [
    { eyebrow: 'Forms', title: 'The right questions, on any page', text: 'Build contact, quote, booking request and sign-up forms with short and long answers, email, phone and drop-down questions. Add a form to any page with the Form block.', points: ['Choose which questions are required', 'Your own thank-you message', 'Reply to the sender straight from the email'], video: 'forms', videoCaption: 'A reply arriving, and working through the inbox.' },
    { eyebrow: 'Inbox', title: 'Every reply in one place', text: 'Replies arrive by email and in your Slate inbox, marked unread until you open them. Mark them done when they’re dealt with, search for an old one, or download the lot as a spreadsheet.', points: ['Unread, read and done, so nothing slips through', 'Search, sort and filter replies', 'Download replies as a CSV file'] },
    { eyebrow: 'Spam', title: 'Spam stopped before it reaches you', text: 'Forms quietly catch the bots that fill everything in, the ones that send a form faster than a person could, and anyone sending the same form over and over. Real people never see a puzzle.', points: ['No “click the traffic lights” puzzles for your visitors', 'Limits on repeated messages from one sender', 'Nothing to set up'] }
]
const grid = {
    title: 'Send replies wherever you work',
    text: 'On the Business and Studio plans, form replies can go straight to the tools you already use.',
    items: [
        { icon: 'chat', title: 'Slack and Discord', text: 'A message in your channel the moment someone gets in touch, with a button to open the reply.' },
        { icon: 'heart', title: 'Mailchimp and Brevo', text: 'Add people who tick the sign-up box straight to your email list.' },
        { icon: 'bolt', title: 'Webhooks', text: 'Send every reply to Zapier, Make or your own system as it arrives.' }
    ]
}
const faqs: FaqItem[] = [
    { q: 'Where do form replies go?', a: 'To your Slate inbox and by email to the people you choose. On Business and Studio plans they can also go to Slack, Discord, Mailchimp, Brevo or a webhook.' },
    { q: 'Do I need a cookie banner for forms?', a: 'No. Slate’s forms and spam protection don’t use cookies. You will need a privacy page explaining what you collect, and Slate’s site health check reminds you.' },
    { q: 'How many forms can I have?', a: 'One on Starter, and up to ten per site on Business and Studio. Replies are unlimited.' },
    { q: 'Can I take bookings?', a: 'Use a form for booking requests, or connect Calendly to let people pick a time themselves.' }
]
</script>

<template>
    <MkFeaturePage
        path="/features/forms"
        eyebrow="Forms and inbox"
        lead="Add contact, quote and booking forms to any page. Every reply lands in your inbox and your email, spam is stopped without puzzles, and replies can go straight to Slack or Mailchimp."
        video="forms"
        video-caption="Form replies in the Slate inbox."
        :sections="sections"
        :grid="grid"
        :faqs="faqs"
    />
</template>
