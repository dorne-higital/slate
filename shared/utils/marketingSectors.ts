/**
 * The "Who it's for" pages. Each one is written for its own kind of business (Google ignores
 * near-copies), and starts people from the matching layout in shared/utils/starterLayouts.ts.
 */
export type SectorSlug = 'trades' | 'salons-and-clinics' | 'shops-and-cafes' | 'clubs-and-charities' | 'freelancers-and-studios'

export interface Sector {
    slug: SectorSlug
    /** id in STARTER_LAYOUTS */
    layoutId: string
    eyebrow: string
    lead: string
    problems: { title: string, text: string }[]
    /** What goes on each page of the starting layout */
    sections: { page: string, text: string }[]
    features: { icon: string, title: string, text: string }[]
    faq: { q: string, a: string }[]
}

export const sector = (slug: string) => SECTORS.find(s => s.slug === slug)

// Kept last: Nuxt's auto-import scanner drops exports that follow an exported array literal
export const SECTORS: Sector[] = [
    {
        slug: 'trades',
        layoutId: 'trade',
        eyebrow: 'For plumbers, electricians, builders and decorators',
        lead: 'Most people check your website before they ring. Show them the work you do, the areas you cover and how to get a quote, then let the quote requests come to your phone.',
        problems: [
            { title: 'Word of mouth only goes so far', text: 'People who hear your name still look you up. If they find nothing, or a site from 2014, they ring the next person on the list.' },
            { title: 'Quotes get lost in texts and voicemail', text: 'A quote form asks the right questions up front, like the job, the postcode and the best time to call, and keeps every request in one inbox.' },
            { title: 'No time for fiddly website updates', text: 'Adding photos of a finished job means clicking the gallery, choosing the pictures and pressing publish. Minutes, not an evening.' }
        ],
        sections: [
            { page: 'Home', text: 'What you do, where you work and a big “Get a quote” button.' },
            { page: 'Services', text: 'Each job you take on, with a line about what’s included.' },
            { page: 'Our work', text: 'Photos of finished jobs, with before-and-after sliders for the satisfying ones.' },
            { page: 'Reviews', text: 'What customers have said, in their own words.' },
            { page: 'Get a quote', text: 'A form for the job, the postcode and the best time to call.' }
        ],
        features: [
            { icon: 'camera', title: 'Before and after', text: 'Drag-to-compare photos that show the difference your work makes.' },
            { icon: 'chat', title: 'Quote requests to your inbox', text: 'Every request by email and in one list, marked done when it’s booked in.' },
            { icon: 'pin', title: 'Areas you cover', text: 'A map and a list of towns, so people know you’ll come out to them.' },
            { icon: 'phone', title: 'WhatsApp button', text: 'A “Message us” button on every page, for people who’d rather text.' },
            { icon: 'star', title: 'Reviews block', text: 'Show what customers have said, with their name and town.' }
        ],
        faq: [
            { q: 'Can customers send photos of the job?', a: 'Forms collect the details you ask for, like the job, postcode and phone number. For photos, the WhatsApp button lets people send them straight to your phone.' },
            { q: 'Will my site show up when people search for a plumber in my town?', a: 'Slate handles the technical side and helps you write titles and descriptions that mention your town and trade. For local searches, also claim your free Google Business Profile, and link it to your Slate site.' },
            { q: 'I already have a Checkatrade or Rated People profile. Do I need a website too?', a: 'Those profiles help people find you, but they also show your competitors next to you. Your own site is somewhere you can send people that’s only about you, and you can link your reviews there.' },
            { q: 'Do I need someone to update it for me?', a: 'No. Click the block you want to change, type or add pictures, and publish. Nothing to install and no code.' }
        ]
    },
    {
        slug: 'salons-and-clinics',
        layoutId: 'practice',
        eyebrow: 'For hair and beauty salons, therapists and clinics',
        lead: 'Give people everything they want to know before they book: your treatments and prices, who they’ll see, and a booking button that works at eleven at night.',
        problems: [
            { title: 'The same questions on the phone all day', text: 'Prices, opening times, parking, “do you do…?”. Put the answers on your site and the phone rings for bookings instead.' },
            { title: 'Clients book elsewhere when they can’t book now', text: 'People decide in the evening. Connect Calendly or link your booking system so they can pick a time the moment they’re ready.' },
            { title: 'Health and personal details need care', text: 'If your forms ask about allergies or conditions, you need to explain how you look after that information. Slate reminds you to have a privacy page and keeps form replies in the UK.' }
        ],
        sections: [
            { page: 'Home', text: 'A calm introduction, your opening times and a “Book now” button.' },
            { page: 'Treatments', text: 'What each treatment involves, how long it takes and who it’s for.' },
            { page: 'Team', text: 'Photos and a few words about each person, so clients know who they’ll see.' },
            { page: 'Prices', text: 'A clear price list people can check before they book.' },
            { page: 'Book', text: 'Your booking calendar, or a form for appointment requests.' }
        ],
        features: [
            { icon: 'calendar', title: 'Online booking', text: 'Connect Calendly, or link to Fresha, Treatwell or your own system.' },
            { icon: 'people', title: 'Team block', text: 'Each person with a photo, their role and what they specialise in.' },
            { icon: 'chart', title: 'Price lists', text: 'Treatments and prices that are easy to read on a phone.' },
            { icon: 'lock', title: 'Data kept in the UK', text: 'Form replies are stored in London, and the health check reminds you about a privacy page.' },
            { icon: 'heart', title: 'Your look throughout', text: 'Your colours and fonts on every page, for a site that feels like your space.' }
        ],
        faq: [
            { q: 'Can clients book appointments through the website?', a: 'Yes. Connect Calendly to show your free times on your site, or add a button that opens the booking system you already use, such as Fresha or Treatwell.' },
            { q: 'Can I put my price list on the site?', a: 'Yes. Use a prices or services block to list treatments with their prices and times, and update it whenever your prices change.' },
            { q: 'Do I need a privacy policy for a salon website?', a: 'If your site collects any personal details, such as a contact or consultation form, UK law expects a privacy page. Slate’s site health check reminds you if one is missing.' },
            { q: 'Can my staff update the site?', a: 'Yes. Invite them as editors so they can update their own profiles and prices without access to billing or settings.' }
        ]
    },
    {
        slug: 'shops-and-cafes',
        layoutId: 'shop',
        eyebrow: 'For independent shops, cafés, bakeries and makers',
        lead: 'Tell people what’s good today, when you’re open and how to find you. Simple to keep up to date, so your site is never the one with last year’s hours.',
        problems: [
            { title: 'Out-of-date opening hours cost visits', text: 'Nothing loses a customer like turning up to a closed door. Change your hours in a minute, whenever they change.' },
            { title: 'Social media posts disappear', text: 'Your best post is gone from people’s feeds in a day. Your website is where the menu, the story and the directions stay put.' },
            { title: 'People want to know what you’ve got', text: 'Show this week’s specials, your best sellers or a seasonal menu with photos, so people know it’s worth the trip.' }
        ],
        sections: [
            { page: 'Home', text: 'Who you are, what’s good right now and when you’re open.' },
            { page: 'Menu or products', text: 'What you sell, with photos and prices.' },
            { page: 'Visit us', text: 'A map, directions, parking and accessibility.' },
            { page: 'Contact', text: 'Phone, email and a form for orders, bookings or questions.' }
        ],
        features: [
            { icon: 'pin', title: 'Map and directions', text: 'A map of where you are and clear directions, right on the page.' },
            { icon: 'clock', title: 'Opening hours', text: 'Easy to find, and easy to change when they do.' },
            { icon: 'calendar', title: 'News and events', text: 'Use the blog for new products, events and seasonal menus.' },
            { icon: 'phone', title: 'WhatsApp and phone', text: 'Let people message or ring you in one tap from their phone.' },
            { icon: 'camera', title: 'Galleries', text: 'Show the shop, the food or the makes with photos that look good on any screen.' }
        ],
        faq: [
            { q: 'Can I sell products online with Slate?', a: 'Slate is built for showing what you sell and bringing people in, not for running an online shop with baskets and stock. Many shops link to a separate shop for online orders.' },
            { q: 'How do I change my opening hours?', a: 'Open the page, click the block with your hours, change them and press publish. It takes about a minute.' },
            { q: 'Can people order or reserve a table?', a: 'Use a form for orders, collections or table requests. Replies arrive by email and in your Slate inbox.' },
            { q: 'Will my café show up on Google Maps?', a: 'Google Maps listings come from your free Google Business Profile. Add your Slate website to that profile, and add a map to your site so people can find you either way.' }
        ]
    },
    {
        slug: 'clubs-and-charities',
        layoutId: 'club',
        eyebrow: 'For sports clubs, charities and community groups',
        lead: 'A site the whole committee can keep up to date, each with their own login. Share fixtures and events, post news, and make it easy for people to join, volunteer or donate.',
        problems: [
            { title: 'The website belongs to one volunteer', text: 'When the one person who knows the password moves on, the site freezes. With Slate, everyone who helps gets their own login, and access is easy to hand over.' },
            { title: 'News is scattered across groups and chats', text: 'Put fixtures, results and events in one public place people can find, link and share, rather than buried in a group chat.' },
            { title: 'New members don’t know how to get involved', text: 'A clear “Join” page and a sign-up form turn interest into names on your list.' }
        ],
        sections: [
            { page: 'Home', text: 'What you do, what’s coming up and how to get involved.' },
            { page: 'About', text: 'Your story, your committee and how you’re run.' },
            { page: 'Events', text: 'Fixtures, meetings and events, with dates and places.' },
            { page: 'News', text: 'Results, updates and thank-yous, posted by anyone on the committee.' },
            { page: 'Join', text: 'How to join, volunteer or donate, with a sign-up form.' }
        ],
        features: [
            { icon: 'people', title: 'Logins for the committee', text: 'Editors can post news and update pages; only admins see settings and billing.' },
            { icon: 'calendar', title: 'Blog for news and results', text: 'Posts with categories, scheduled to go out when you want them.' },
            { icon: 'chat', title: 'Sign-up forms', text: 'New members, volunteers and enquiries, all in one inbox.' },
            { icon: 'heart', title: 'Email list sign-ups', text: 'Send form sign-ups straight to Mailchimp or Brevo for your newsletter.' },
            { icon: 'clock', title: 'Nothing breaks when people leave', text: 'Remove someone and their access goes; the site carries on.' }
        ],
        faq: [
            { q: 'Can several people on the committee edit the site?', a: 'Yes. Business includes up to three people per site and Studio up to ten. Each has their own login and a role, so editors can post news without seeing billing.' },
            { q: 'Can we take donations?', a: 'Add a button that links to your donation page, such as JustGiving, Enthuse or your bank’s payment link. Slate doesn’t take card payments itself.' },
            { q: 'How do we hand the website over when someone steps down?', a: 'An owner invites the new person and removes the old one. Nobody needs to share passwords, and nothing is lost.' },
            { q: 'Can we post match results and fixtures?', a: 'Yes. Use the blog for results and news, and a page with a details list or timeline for fixtures and events.' }
        ]
    },
    {
        slug: 'freelancers-and-studios',
        layoutId: 'studio',
        eyebrow: 'For designers, developers and small agencies',
        lead: 'Build websites for your clients on Slate and stop looking after hosting, plugins and updates. Hand over editing safely, connect their domains, and keep every site in one login.',
        problems: [
            { title: 'Maintenance eats your margin', text: 'Plugin updates, security patches and hosting tickets are unpaid work. Slate sites have nothing to update and nothing to patch.' },
            { title: 'Clients break things when they edit', text: 'Blocks keep layouts intact while clients change words and pictures, and every publish can be rolled back.' },
            { title: 'Too many logins for too many sites', text: 'Every client site sits in one Slate account, with your own role on each and theirs on theirs.' }
        ],
        sections: [
            { page: 'Home', text: 'Your best work up front, and what you do.' },
            { page: 'Work', text: 'Case studies as project pages, each with its own story and pictures.' },
            { page: 'About', text: 'Who you are, how you work and who you work with.' },
            { page: 'Contact', text: 'A project enquiry form that asks the right questions.' }
        ],
        features: [
            { icon: 'globe', title: 'Five sites on Studio', text: 'Studio includes five websites, with more at a small monthly price each.' },
            { icon: 'people', title: 'Roles for clients', text: 'Make clients editors or admins, and keep ownership with you or hand it over.' },
            { icon: 'shield', title: 'Their domains, connected', text: 'Connect each client’s domain with step-by-step instructions, HTTPS included.' },
            { icon: 'clock', title: 'Page history', text: 'If a client publishes something odd, put the previous version back in seconds.' },
            { icon: 'camera', title: 'Project pages', text: 'Case studies with their own pages, shown in a grid on your work page.' }
        ],
        faq: [
            { q: 'Can I manage several client websites from one account?', a: 'Yes. The Studio plan includes five sites, with extra sites available for a monthly fee each, all switched between from one login.' },
            { q: 'Can my client own their site?', a: 'Yes. Invite them as an owner or admin, or keep ownership yourself and make them an editor. You decide who sees billing.' },
            { q: 'Can I build custom blocks for a client?', a: 'Slate’s blocks are built into the platform. If you need something specific, tell us: new blocks are added to Slate over time, for everyone.' },
            { q: 'Is there a white-label option?', a: 'Business and Studio sites show no Slate branding at all. The editing dashboard itself is Slate-branded.' }
        ]
    }
]
