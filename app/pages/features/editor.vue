<script setup lang="ts">
definePageMeta({ layout: 'marketing', middleware: 'marketing' })
const sections = [
    { eyebrow: 'Blocks', title: 'Pick a block, type into it, done', text: 'Every page is a stack of ready-made blocks. Add a hero, a list of services, a gallery or a contact form, then click any of them to change the words and pictures. Drag to put them in a different order.', points: ['31 blocks, from heroes and galleries to reviews, team, prices and maps', 'Before-and-after pictures, steps, numbers and questions and answers', 'Every block can have its own background, spacing and fade-in'], video: 'editor', videoCaption: 'Adding, editing and reordering blocks.' },
    { eyebrow: 'Your look', title: 'Set your colours and fonts once', text: 'Choose your colours, fonts, corner style, header and footer for the whole site in one place. Every block follows them, so nothing looks out of place and a change shows everywhere at once.', points: ['Ready-made colour sets to start from, or your own', 'Hundreds of Google Fonts for headings and text', 'Header and footer styles, logo size and menu layout'] },
    { eyebrow: 'Safe to change', title: 'Change your mind as often as you like', text: 'Edits save as you go, but visitors only see them when you publish. Every publish is kept, so you can put any of the last 30 versions of a page back with one click.', points: ['Undo while you edit', 'Page history with who published what, and when', 'Drafts for new pages until you’re ready'] },
    { eyebrow: 'Content', title: 'Blog, projects and the pages people forget', text: 'Write blog posts with categories and schedule them for later. Show your work as projects with their own pages. Design your own “page not found” and “we’re offline” pages too.', points: ['Blog posts with cover images, categories and scheduling', 'Project pages for case studies and portfolios', 'Your own 404 and offline pages, in your style'] }
]
const grid = {
    title: 'Working on it together',
    text: 'Invite people to help, with the right level of access for each.',
    items: [
        { icon: 'people', title: 'Roles for everyone', text: 'Owners, admins, editors and viewers. Editors can change pages without touching billing or settings.' },
        { icon: 'lock', title: 'Each person has their own login', text: 'No shared passwords. Remove someone and their access goes with them.' },
        { icon: 'clock', title: 'See who changed what', text: 'Page history shows who published each version, so nothing is a mystery.' }
    ]
}
const faqs: FaqItem[] = [
    { q: 'Can I move blocks around after I’ve added them?', a: 'Yes. Drag any block up or down the page, copy it, or remove it. Nothing changes on your live site until you publish.' },
    { q: 'What if I publish something by mistake?', a: 'Open the page’s history, pick the version from before, and restore it. It goes back into your draft so you can check it, then publish again.' },
    { q: 'Can I use my own fonts and colours?', a: 'Yes. Use any colours you like, and choose from hundreds of Google Fonts for your headings and text.' },
    { q: 'Do I need a designer?', a: 'No. The blocks are designed to look right together with your colours and fonts. Start from a layout for your kind of business and change what you need.' }
]
</script>

<template>
    <MkFeaturePage
        path="/features/editor"
        eyebrow="Editor and blocks"
        lead="Build pages by adding ready-made blocks and typing into them. Set your colours and fonts once, publish when you’re ready, and go back to any earlier version."
        video="editor"
        video-caption="The page editor."
        :sections="sections"
        :grid="grid"
        :faqs="faqs"
    />
</template>
