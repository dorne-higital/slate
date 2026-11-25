import { SHOWCASE_ICONS } from './showcaseIcons'

/**
 * The block catalogue: every block type, its editable fields and starting content.
 * The editor builds its forms from this, and the server cleans every save against it,
 * so a block can only ever hold the fields listed here.
 *
 * Every block also gets the SECTION_FIELDS (background, spacing, fade-in, anchor) — see cleanBlocks.
 * New fields on an existing block must keep old pages working: components treat missing props as defaults.
 */
export type FieldKind = 'text' | 'textarea' | 'url' | 'image' | 'form' | 'select'

export interface BlockField {
    key: string
    label: string
    kind: FieldKind
    help?: string
    max?: number
    /** For kind 'select': the choices; the first is the default */
    options?: { value: string, label: string }[]
}

export type BlockGroup = 'Headers and banners' | 'Showcase' | 'Text and images' | 'Portfolio' | 'Show what you do' | 'Proof and people' | 'Media' | 'Get in touch' | 'Blog'
export const BLOCK_GROUPS: BlockGroup[] = ['Headers and banners', 'Showcase', 'Text and images', 'Portfolio', 'Show what you do', 'Proof and people', 'Media', 'Get in touch', 'Blog']

export interface BlockType {
    type: string
    name: string
    desc: string
    /** Section in the editor's block library */
    group: BlockGroup
    fields: BlockField[]
    /** For blocks holding a repeating list (services, reviews…), stored as props.items */
    items?: { label: string, fields: BlockField[], max: number }
    defaults: Record<string, unknown>
}

const opts = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))
const eyebrow: BlockField = { key: 'eyebrow', label: 'Label above the heading', kind: 'text', help: 'Optional. A short word or two, like “Recent work”.', max: 60 }
const heading: BlockField = { key: 'heading', label: 'Heading', kind: 'text', max: 160 }
const intro: BlockField = { key: 'intro', label: 'Intro', kind: 'textarea', max: 600 }
const body: BlockField = { key: 'body', label: 'Text', kind: 'textarea', help: 'Leave a blank line between paragraphs.', max: 8000 }
const buttonLabel: BlockField = { key: 'buttonLabel', label: 'Button text', kind: 'text', help: 'Leave empty for no button.', max: 60 }
const buttonUrl: BlockField = { key: 'buttonUrl', label: 'Button goes to', kind: 'url', help: 'A page like /get-a-quote, or a full web address.', max: 500 }
const button2Label: BlockField = { key: 'button2Label', label: 'Second button text', kind: 'text', help: 'Optional, shown as an outline button.', max: 60 }
const button2Url: BlockField = { key: 'button2Url', label: 'Second button goes to', kind: 'url', max: 500 }
const image = (key = 'imageUrl', label = 'Image'): BlockField => ({ key, label, kind: 'image', help: 'Choose from your media library, or paste an image address.', max: 1000 })
const alt = (key = 'imageAlt'): BlockField => ({ key, label: 'Describe the image', kind: 'text', help: 'For people using screen readers. Leave empty for decoration.', max: 200 })
// Showcase blocks: a picture frame, and buttons that can be app store badges
const frame: BlockField = { key: 'frame', label: 'Show pictures in', kind: 'select', options: opts(['phone', 'A phone'], ['browser', 'A browser window'], ['photo', 'A photo frame'], ['plain', 'No frame']) }
const buttonStyle: BlockField = { key: 'buttonStyle', label: 'Buttons', kind: 'select', options: opts(['buttons', 'Buttons'], ['stores', 'App Store and Google Play']), help: 'Store buttons use the links in Settings › App store links.' }
const qr: BlockField = { key: 'qr', label: 'QR code', kind: 'select', options: opts(['no', 'No'], ['yes', 'Show one on computers']), help: 'For store buttons it opens the right store on each phone; otherwise it opens the main button’s link.' }
const showcaseButtons = [buttonStyle, buttonLabel, buttonUrl, button2Label, button2Url, qr]
const columns: BlockField = { key: 'columns', label: 'Columns', kind: 'select', options: opts(['3', '3'], ['2', '2'], ['4', '4']) }

/** On every block: how its section sits on the page */
export const SECTION_FIELDS: BlockField[] = [
    { key: 'sectionBg', label: 'Background', kind: 'select', options: opts(['', 'Page'], ['soft', 'Soft'], ['dark', 'Dark'], ['primary', 'Main colour'], ['accent', 'Accent colour']) },
    { key: 'sectionSpace', label: 'Space above and below', kind: 'select', options: opts(['', 'Normal'], ['compact', 'Less'], ['roomy', 'More'], ['none', 'None']) },
    { key: 'sectionReveal', label: 'Fade in when scrolled to', kind: 'select', options: opts(['', 'No'], ['fade', 'Yes']) },
    { key: 'sectionAnchor', label: 'Link name', kind: 'text', help: 'Optional. Lets menus link straight here, e.g. “pricing” → /#pricing.', max: 40 }
]

export const BLOCK_TYPES: BlockType[] = [
    // ── Headers and banners ──
    {
        type: 'hero',
        group: 'Headers and banners',
        name: 'Hero',
        desc: 'Big heading at the top of a page, with buttons and an optional picture',
        fields: [
            { key: 'layout', label: 'Layout', kind: 'select', options: opts(['left', 'Words on the left'], ['split', 'Words and picture side by side'], ['centred', 'Centred'], ['banner', 'Coloured band (page header)']) },
            eyebrow, heading, { key: 'text', label: 'Text', kind: 'textarea', max: 600 }, buttonLabel, buttonUrl, button2Label, button2Url,
            image('imageUrl', 'Picture (for side by side)'), alt()
        ],
        defaults: { layout: 'left', eyebrow: '', heading: 'Your headline here', text: 'One or two sentences about what you do and who for.', buttonLabel: 'Get in touch', buttonUrl: '', button2Label: '', button2Url: '', imageUrl: '', imageAlt: '' }
    },
    {
        type: 'cta',
        group: 'Headers and banners',
        name: 'Call to action',
        desc: 'A band that asks people to get in touch',
        fields: [{ key: 'style', label: 'Style', kind: 'select', options: opts(['band', 'Dark band'], ['card', 'Card'], ['plain', 'Plain']) }, eyebrow, heading, { key: 'text', label: 'Text', kind: 'textarea', max: 400 }, buttonLabel, buttonUrl],
        defaults: { style: 'band', eyebrow: '', heading: 'Ready to start?', text: '', buttonLabel: 'Get in touch', buttonUrl: '' }
    },
    {
        type: 'marquee',
        group: 'Headers and banners',
        name: 'Scrolling band',
        desc: 'Words that slowly scroll across the page',
        fields: [{ key: 'size', label: 'Size', kind: 'select', options: opts(['large', 'Large'], ['small', 'Small']) }, { key: 'speed', label: 'Speed', kind: 'select', options: opts(['normal', 'Normal'], ['slow', 'Slow'], ['fast', 'Fast']) }],
        items: { label: 'Word', max: 16, fields: [{ key: 'text', label: 'Words', kind: 'text', max: 60 }] },
        defaults: { size: 'large', speed: 'normal', items: [{ text: 'Web design' }, { text: 'Development' }, { text: 'Hosting' }, { text: 'Support' }] }
    },

    // ── Showcase: show off an app, product, service or place ──
    {
        type: 'showcase',
        group: 'Showcase',
        name: 'Showcase hero',
        desc: 'Big heading with your pictures in a phone, browser or photo frame, buttons or store badges',
        fields: [
            { key: 'layout', label: 'Layout', kind: 'select', options: opts(['split', 'Words and picture side by side'], ['centred', 'Centred, pictures below'], ['band', 'Coloured band, tilted pictures']) },
            frame, image('logoUrl', 'Small logo or app icon (optional)'), eyebrow, heading, { key: 'text', label: 'Text', kind: 'textarea', max: 600 },
            ...showcaseButtons,
            { key: 'rating', label: 'Star rating (optional)', kind: 'text', help: 'e.g. 4.8. Only use a real figure.', max: 4 },
            { key: 'ratingText', label: 'Next to the stars', kind: 'text', help: 'e.g. from 1,200 App Store reviews', max: 80 },
            image('imageUrl', 'Main picture'), alt(),
            image('image2Url', 'Second picture (centred and band layouts)'), image('image3Url', 'Third picture (centred layout)')
        ],
        defaults: { layout: 'split', frame: 'phone', logoUrl: '', eyebrow: '', heading: 'Your big promise in a few words', text: 'One or two lines on what it is and who it’s for.', buttonStyle: 'buttons', buttonLabel: 'Get started', buttonUrl: '', button2Label: '', button2Url: '', qr: 'no', rating: '', ratingText: '', imageUrl: '', imageAlt: '', image2Url: '', image3Url: '' }
    },
    {
        type: 'buttonRow',
        group: 'Showcase',
        name: 'Buttons',
        desc: 'A short heading with buttons or store badges, and an optional QR code',
        fields: [{ key: 'align', label: 'Align', kind: 'select', options: opts(['centre', 'Centre'], ['left', 'Left']) }, eyebrow, heading, { key: 'text', label: 'Text', kind: 'textarea', max: 400 }, ...showcaseButtons],
        defaults: { align: 'centre', eyebrow: '', heading: 'Get the app', text: '', buttonStyle: 'stores', buttonLabel: '', buttonUrl: '', button2Label: '', button2Url: '', qr: 'yes' }
    },
    {
        type: 'carousel',
        group: 'Showcase',
        name: 'Picture carousel',
        desc: 'Screens or photos to swipe through, each with a caption',
        fields: [eyebrow, heading, intro, frame],
        items: { label: 'Picture', max: 12, fields: [image('imageUrl', 'Picture'), alt(), { key: 'title', label: 'Caption', kind: 'text', max: 80 }, { key: 'text', label: 'More about it (optional)', kind: 'text', max: 160 }] },
        defaults: { eyebrow: '', heading: 'Take a look', intro: '', frame: 'phone', items: [{ imageUrl: '', imageAlt: '', title: 'First screen', text: '' }, { imageUrl: '', imageAlt: '', title: 'Second screen', text: '' }, { imageUrl: '', imageAlt: '', title: 'Third screen', text: '' }] }
    },
    {
        type: 'featureRows',
        group: 'Showcase',
        name: 'Feature rows',
        desc: 'A picture and words for each feature, swapping sides as you scroll',
        fields: [frame, { key: 'firstSide', label: 'First picture on the', kind: 'select', options: opts(['left', 'Left'], ['right', 'Right']) }],
        items: { label: 'Feature', max: 8, fields: [{ key: 'label', label: 'Label above the heading', kind: 'text', max: 60 }, { key: 'title', label: 'Heading', kind: 'text', max: 120 }, { key: 'text', label: 'Text', kind: 'textarea', max: 800 }, { key: 'ticks', label: 'Tick list', kind: 'textarea', help: 'Optional. One point per line.', max: 1000 }, image('imageUrl', 'Picture'), alt(), { key: 'buttonLabel', label: 'Button text (optional)', kind: 'text', max: 60 }, { key: 'buttonUrl', label: 'Button goes to', kind: 'url', max: 500 }] },
        defaults: { frame: 'phone', firstSide: 'left', items: [{ label: '', title: 'What the first feature does', text: 'A couple of lines on why it matters.', ticks: '', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: '' }, { label: '', title: 'What the second feature does', text: 'A couple of lines on why it matters.', ticks: '', imageUrl: '', imageAlt: '', buttonLabel: '', buttonUrl: '' }] }
    },
    {
        type: 'featureGrid',
        group: 'Showcase',
        name: 'Feature grid',
        desc: 'Features as cards with an icon each',
        fields: [eyebrow, heading, intro, { key: 'columns', label: 'Columns', kind: 'select', options: opts(['3', '3'], ['2', '2'], ['4', '4']) }, { key: 'style', label: 'Style', kind: 'select', options: opts(['cards', 'Cards'], ['plain', 'Plain, no cards']) }],
        items: { label: 'Feature', max: 12, fields: [{ key: 'icon', label: 'Icon', kind: 'select', options: SHOWCASE_ICONS.map(i => ({ value: i.key, label: i.label })) }, { key: 'title', label: 'Name', kind: 'text', max: 80 }, { key: 'text', label: 'Description', kind: 'textarea', max: 300 }] },
        defaults: { eyebrow: '', heading: 'Everything you need', intro: '', columns: '3', style: 'cards', items: [{ icon: 'bolt', title: 'Fast', text: 'A line about it.' }, { icon: 'heart', title: 'Friendly', text: 'A line about it.' }, { icon: 'shield', title: 'Safe', text: 'A line about it.' }] }
    },
    {
        type: 'showcaseCta',
        group: 'Showcase',
        name: 'Call to action with picture',
        desc: 'A coloured panel with buttons or store badges and a picture peeking up',
        fields: [eyebrow, heading, { key: 'text', label: 'Text', kind: 'textarea', max: 400 }, ...showcaseButtons, frame, image('imageUrl', 'Picture'), alt()],
        defaults: { eyebrow: '', heading: 'Ready to get started?', text: 'One line that gives one last reason to act now.', buttonStyle: 'buttons', buttonLabel: 'Get started', buttonUrl: '', button2Label: '', button2Url: '', qr: 'no', frame: 'phone', imageUrl: '', imageAlt: '' }
    },

    // ── Text and images ──
    {
        type: 'text',
        group: 'Text and images',
        name: 'Text',
        desc: 'Paragraphs with a heading',
        fields: [{ key: 'align', label: 'Align', kind: 'select', options: opts(['left', 'Left'], ['centre', 'Centre']) }, eyebrow, heading, body],
        defaults: { align: 'left', eyebrow: '', heading: 'About us', body: 'Write a few paragraphs here.' }
    },
    {
        type: 'imageText',
        group: 'Text and images',
        name: 'Image and text',
        desc: 'A picture beside some words, with an optional tick list and button',
        fields: [
            { key: 'imageSide', label: 'Picture on the', kind: 'select', options: opts(['left', 'Left'], ['right', 'Right']) },
            { key: 'imageStyle', label: 'Picture style', kind: 'select', options: opts(['plain', 'Plain'], ['card', 'In a card with a shadow'], ['tilted', 'Tilted, like a screenshot'], ['round', 'Round']) },
            eyebrow, heading, body,
            { key: 'ticks', label: 'Tick list', kind: 'textarea', help: 'Optional. One point per line.', max: 1500 },
            buttonLabel, buttonUrl, image(), alt()
        ],
        defaults: { imageSide: 'left', imageStyle: 'plain', eyebrow: '', heading: 'How we work', body: 'Tell people what it’s like to work with you.', ticks: '', buttonLabel: '', buttonUrl: '', imageUrl: '', imageAlt: '' }
    },
    {
        type: 'quote',
        group: 'Text and images',
        name: 'Big statement',
        desc: 'One sentence, set large, to make a point',
        fields: [eyebrow, { key: 'text', label: 'Statement', kind: 'textarea', max: 300 }, { key: 'byline', label: 'Who said it', kind: 'text', help: 'Optional.', max: 100 }],
        defaults: { eyebrow: '', text: 'Good websites don’t need to be complicated. They need to work.', byline: '' }
    },
    {
        type: 'details',
        group: 'Text and images',
        name: 'Details list',
        desc: 'Labels and values, like Year: 2025 or Platform: iPhone',
        fields: [eyebrow, heading, { key: 'layout', label: 'Layout', kind: 'select', options: opts(['row', 'In a row'], ['list', 'Stacked list']) }],
        items: { label: 'Detail', max: 12, fields: [{ key: 'label', label: 'Label', kind: 'text', max: 40 }, { key: 'value', label: 'Value', kind: 'text', max: 120 }, { key: 'url', label: 'Links to (optional)', kind: 'url', max: 500 }] },
        defaults: { eyebrow: '', heading: '', layout: 'row', items: [{ label: 'Year', value: '2025', url: '' }, { label: 'Type', value: 'New build', url: '' }, { label: 'Status', value: 'Live', url: '' }] }
    },

    // ── Portfolio ──
    {
        type: 'projects',
        group: 'Portfolio',
        name: 'Projects',
        desc: 'Your projects as cards, with category filters',
        fields: [
            eyebrow, heading, intro,
            { key: 'layout', label: 'Layout', kind: 'select', options: opts(['grid', 'Grid of cards'], ['rows', 'Big rows, alternating sides'], ['carousel', 'Carousel']) },
            { key: 'filters', label: 'Category filters', kind: 'select', options: opts(['show', 'Show'], ['hide', 'Hide']) },
            { key: 'which', label: 'Which projects', kind: 'select', options: opts(['all', 'All'], ['featured', 'Only featured ones']) },
            { key: 'count', label: 'How many', kind: 'text', help: 'A number, or leave empty for all.', max: 3 },
            buttonLabel, buttonUrl
        ],
        defaults: { eyebrow: 'Recent work', heading: 'Some of my latest work', intro: '', layout: 'grid', filters: 'show', which: 'all', count: '', buttonLabel: '', buttonUrl: '' }
    },
    {
        type: 'gallery',
        group: 'Portfolio',
        name: 'Gallery',
        desc: 'Images in a grid; click one to see it large',
        fields: [eyebrow, heading, columns, { key: 'shape', label: 'Image shape', kind: 'select', options: opts(['natural', 'As uploaded'], ['square', 'Square'], ['wide', 'Wide (16:10)'], ['phone', 'Tall (phone screenshots)']) }],
        items: { label: 'Image', max: 40, fields: [image('url', 'Image'), alt('alt'), { key: 'caption', label: 'Caption', kind: 'text', max: 160 }] },
        defaults: { eyebrow: '', heading: '', columns: '3', shape: 'natural', items: [] }
    },
    {
        type: 'beforeAfter',
        group: 'Portfolio',
        name: 'Before and after',
        desc: 'Drag a slider to compare two pictures',
        fields: [eyebrow, heading, image('before', 'Before'), image('after', 'After'), { key: 'beforeLabel', label: 'Before label', kind: 'text', max: 30 }, { key: 'afterLabel', label: 'After label', kind: 'text', max: 30 }],
        defaults: { eyebrow: '', heading: '', before: '', after: '', beforeLabel: 'Before', afterLabel: 'After' }
    },

    // ── Show what you do ──
    {
        type: 'services',
        group: 'Show what you do',
        name: 'Services',
        desc: 'A grid of things you offer',
        fields: [eyebrow, heading, intro, columns],
        items: { label: 'Service', max: 12, fields: [{ key: 'title', label: 'Name', kind: 'text', max: 100 }, { key: 'text', label: 'Description', kind: 'textarea', max: 400 }, image('icon', 'Icon or picture (optional)')] },
        defaults: {
            eyebrow: '', heading: 'What we do', intro: '', columns: '3',
            items: [
                { title: 'First service', text: 'A sentence about it.', icon: '' },
                { title: 'Second service', text: 'A sentence about it.', icon: '' },
                { title: 'Third service', text: 'A sentence about it.', icon: '' }
            ]
        }
    },
    {
        type: 'steps',
        group: 'Show what you do',
        name: 'Steps',
        desc: 'How you work, as numbered steps',
        fields: [eyebrow, heading, intro],
        items: { label: 'Step', max: 8, fields: [{ key: 'title', label: 'Step', kind: 'text', max: 100 }, { key: 'text', label: 'What happens', kind: 'textarea', max: 400 }] },
        defaults: { eyebrow: 'How it works', heading: 'From first chat to launch', intro: '', items: [{ title: 'Chat', text: 'We talk about what you need.' }, { title: 'Build', text: 'I design and build it, showing you as I go.' }, { title: 'Launch', text: 'It goes live, and I’m here if you need a hand.' }] }
    },
    {
        type: 'stats',
        group: 'Show what you do',
        name: 'Numbers',
        desc: 'A row of big numbers, like 40+ sites built',
        fields: [eyebrow, heading],
        items: { label: 'Number', max: 6, fields: [{ key: 'value', label: 'Number', kind: 'text', help: 'e.g. 40+, 7 years, 100%', max: 20 }, { key: 'label', label: 'What it is', kind: 'text', max: 80 }] },
        defaults: { eyebrow: '', heading: '', items: [{ value: '40+', label: 'Websites built' }, { value: '7', label: 'Years doing this' }, { value: '100%', label: 'Happy clients' }] }
    },
    {
        type: 'logos',
        group: 'Show what you do',
        name: 'Logos and tools',
        desc: 'A strip of logos, or names as tags',
        fields: [eyebrow, heading, { key: 'style', label: 'Show as', kind: 'select', options: opts(['tags', 'Name tags'], ['logos', 'Logos'], ['scroll', 'Logos scrolling past']) }],
        items: { label: 'Logo or name', max: 30, fields: [{ key: 'name', label: 'Name', kind: 'text', max: 60 }, image('logo', 'Logo (optional)'), { key: 'url', label: 'Links to (optional)', kind: 'url', max: 500 }] },
        defaults: { eyebrow: '', heading: 'What I use', style: 'tags', items: [{ name: 'Nuxt', logo: '', url: '' }, { name: 'Vue', logo: '', url: '' }, { name: 'GitHub', logo: '', url: '' }] }
    },
    {
        type: 'timeline',
        group: 'Show what you do',
        name: 'Timeline',
        desc: 'Experience or history, year by year',
        fields: [eyebrow, heading],
        items: { label: 'Entry', max: 20, fields: [{ key: 'when', label: 'When', kind: 'text', help: 'e.g. 2021 – now', max: 40 }, { key: 'title', label: 'Title', kind: 'text', max: 100 }, { key: 'text', label: 'Details', kind: 'textarea', max: 500 }] },
        defaults: { eyebrow: '', heading: 'Experience', items: [{ when: '2021 – now', title: 'Freelance web developer', text: 'Building sites for small businesses.' }] }
    },

    // ── Proof and people ──
    {
        type: 'reviews',
        group: 'Proof and people',
        name: 'Reviews',
        desc: 'Quotes from customers',
        fields: [eyebrow, heading, { key: 'layout', label: 'Layout', kind: 'select', options: opts(['grid', 'Cards'], ['feature', 'One big quote at a time'], ['stack', 'Stacked list']) }],
        items: { label: 'Review', max: 12, fields: [{ key: 'quote', label: 'What they said', kind: 'textarea', max: 1200 }, { key: 'name', label: 'Who said it', kind: 'text', max: 100 }, { key: 'role', label: 'Their role or company', kind: 'text', max: 100 }, image('photo', 'Photo (optional)')] },
        defaults: { eyebrow: '', heading: 'What customers say', layout: 'grid', items: [{ quote: 'Paste a review from a happy customer here.', name: 'Their name', role: 'Where they’re from', photo: '' }] }
    },
    {
        type: 'team',
        group: 'Proof and people',
        name: 'Team',
        desc: 'Photos and roles of the people behind the business',
        fields: [eyebrow, heading, intro],
        items: { label: 'Person', max: 24, fields: [image('photo', 'Photo'), { key: 'name', label: 'Name', kind: 'text', max: 80 }, { key: 'role', label: 'Role', kind: 'text', max: 80 }, { key: 'bio', label: 'Short bio', kind: 'textarea', max: 400 }] },
        defaults: { eyebrow: '', heading: 'Meet the team', intro: '', items: [{ photo: '', name: 'Name', role: 'Role', bio: '' }] }
    },
    {
        type: 'faq',
        group: 'Proof and people',
        name: 'Questions and answers',
        desc: 'Expandable list of questions',
        fields: [eyebrow, heading],
        items: { label: 'Question', max: 30, fields: [{ key: 'question', label: 'Question', kind: 'text', max: 200 }, { key: 'answer', label: 'Answer', kind: 'textarea', max: 2000 }] },
        defaults: { eyebrow: '', heading: 'Questions people ask', items: [{ question: 'How long does it take?', answer: 'Answer the question here.' }] }
    },

    // ── Media ──
    {
        type: 'video',
        group: 'Media',
        name: 'Video',
        desc: 'A YouTube or Vimeo video',
        fields: [eyebrow, heading, { key: 'url', label: 'Video address', kind: 'url', help: 'Paste the YouTube or Vimeo link.', max: 500 }, { key: 'caption', label: 'Caption', kind: 'text', max: 200 }],
        defaults: { eyebrow: '', heading: '', url: '', caption: '' }
    },
    {
        type: 'image',
        group: 'Media',
        name: 'Big image',
        desc: 'One picture, wide or full width',
        fields: [image('url', 'Image'), alt('alt'), { key: 'width', label: 'Width', kind: 'select', options: opts(['wide', 'Same as the text'], ['full', 'Edge to edge']) }, { key: 'caption', label: 'Caption', kind: 'text', max: 200 }],
        defaults: { url: '', alt: '', width: 'wide', caption: '' }
    },

    // ── Get in touch ──
    {
        type: 'form',
        group: 'Get in touch',
        name: 'Form',
        desc: 'Any form from your Forms inbox',
        fields: [eyebrow, heading, intro, { key: 'formId', label: 'Form', kind: 'form', help: 'Replies go to your Forms inbox.' }],
        defaults: { eyebrow: '', heading: 'Get in touch', intro: '', formId: '' }
    },
    {
        type: 'contact',
        group: 'Get in touch',
        name: 'Contact details',
        desc: 'Address, phone, email and opening hours, with a map',
        fields: [
            eyebrow, heading, { key: 'email', label: 'Email', kind: 'text', max: 120 }, { key: 'phone', label: 'Phone', kind: 'text', max: 40 },
            { key: 'address', label: 'Address', kind: 'textarea', max: 300 }, { key: 'hours', label: 'Opening hours', kind: 'textarea', help: 'One line per day or range.', max: 400 },
            { key: 'map', label: 'Map', kind: 'select', options: opts(['show', 'Show a map of the address'], ['hide', 'No map']) }
        ],
        defaults: { eyebrow: '', heading: 'Find us', email: '', phone: '', address: '', hours: '', map: 'show' }
    },
    {
        type: 'booking',
        group: 'Get in touch',
        name: 'Booking',
        desc: 'Your Calendly booking calendar',
        fields: [eyebrow, heading, intro],
        defaults: { eyebrow: '', heading: 'Book a time', intro: 'Pick a time that suits you.' }
    },

    // ── Blog ──
    {
        type: 'latestPosts',
        group: 'Blog',
        name: 'Latest posts',
        desc: 'Newest posts from your blog',
        fields: [eyebrow, heading, { key: 'count', label: 'How many posts', kind: 'text', help: 'A number from 1 to 12.', max: 2 }],
        defaults: { eyebrow: '', heading: 'From the blog', count: '3' }
    }
]

export function findBlockType(type: string): BlockType | undefined {
    return BLOCK_TYPES.find(b => b.type === type)
}

export function newBlock(type: string): Block {
    const def = findBlockType(type)!
    return { id: crypto.randomUUID(), type, props: structuredClone(def.defaults) }
}

/** Only web, mail, phone and on-site links. Anything else (javascript:, data:…) becomes empty. */
export function safeUrl(value: string): string {
    const v = value.trim()
    if (!v) return ''
    if (v.startsWith('/') && !v.startsWith('//')) return v
    if (v.startsWith('#')) return v
    if (/^(https?:\/\/|mailto:|tel:)/i.test(v)) return v
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/.*)?$/i.test(v)) return `https://${v}`
    return ''
}

function cleanField(field: BlockField, raw: unknown): string {
    const value = typeof raw === 'string' ? raw : ''
    if (field.kind === 'form') return /^[0-9a-f-]{36}$/i.test(value) ? value : ''
    if (field.kind === 'select') return field.options!.some(o => o.value === value) ? value : field.options![0]!.value
    const cut = value.slice(0, field.max ?? 1000)
    if (field.key === 'sectionAnchor') return cut.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return field.kind === 'url' || field.kind === 'image' ? safeUrl(cut) : cut
}

/** Rebuilds blocks from the catalogue, dropping unknown types and fields. Used on every save. */
export function cleanBlocks(input: unknown): Block[] {
    if (!Array.isArray(input)) return []
    const out: Block[] = []
    for (const raw of input.slice(0, 100)) {
        if (!raw || typeof raw !== 'object') continue
        const { id, type, props } = raw as { id?: unknown, type?: unknown, props?: Record<string, unknown> }
        const def = typeof type === 'string' ? findBlockType(type) : undefined
        if (!def) continue
        const clean: Record<string, unknown> = {}
        for (const f of [...def.fields, ...SECTION_FIELDS]) clean[f.key] = cleanField(f, props?.[f.key])
        if (def.items) {
            const items = Array.isArray(props?.items) ? props.items.slice(0, def.items.max) : []
            clean.items = items.map((item: Record<string, unknown>) => {
                const row: Record<string, string> = {}
                for (const f of def.items!.fields) row[f.key] = cleanField(f, item?.[f.key])
                return row
            })
        }
        out.push({ id: typeof id === 'string' && /^[\w-]{1,64}$/.test(id) ? id : crypto.randomUUID(), type: def.type, props: clean })
    }
    return out
}

/** A select field's value with its default when missing (for components and old saved blocks). */
export function choice(type: string, key: string, value: unknown): string {
    const field = findBlockType(type)?.fields.find(f => f.key === key)
    if (!field?.options) return String(value ?? '')
    return field.options.some(o => o.value === value) ? String(value) : field.options[0]!.value
}
