/** The starting layouts offered at sign-up (step 2). Each creates these pages, home first. */
export interface StarterLayout {
    id: string
    name: string
    hero: string
    pages: string[]
}

export const STARTER_LAYOUTS: StarterLayout[] = [
    { id: 'trade', name: 'Trade or service', hero: 'Quality work, booked in days', pages: ['Home', 'Services', 'Our work', 'Reviews', 'Get a quote'] },
    { id: 'shop', name: 'Shop or café', hero: 'Come and see us', pages: ['Home', 'Menu or products', 'Visit us', 'Contact'] },
    { id: 'studio', name: 'Studio or freelancer', hero: 'Selected work', pages: ['Home', 'Work', 'About', 'Contact'] },
    { id: 'practice', name: 'Clinic or practice', hero: 'Book an appointment', pages: ['Home', 'Treatments', 'Team', 'Prices', 'Book'] },
    { id: 'club', name: 'Club or charity', hero: 'Get involved', pages: ['Home', 'About', 'Events', 'News', 'Join'] },
    { id: 'blank', name: 'Blank', hero: 'Your headline here', pages: ['Home'] }
]

export function findStarterLayout(id: string): StarterLayout {
    return STARTER_LAYOUTS.find(l => l.id === id) ?? STARTER_LAYOUTS[0]!
}
