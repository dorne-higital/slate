/**
 * Pages every site has that visitors don't reach by address: they're shown when something happens
 * (like a missing page). They're edited like any page but can't be deleted or moved.
 */
export interface SystemPageInfo {
    key: string
    /** Stored path; the underscore keeps it clear of any address a person can make */
    path: string
    title: string
    desc: string
    blocks: () => Block[]
}

export const SYSTEM_PAGES: SystemPageInfo[] = [
    {
        key: '404',
        path: '/_404',
        title: 'Page not found',
        desc: 'Shown when someone visits an address that doesn’t exist (a 404).',
        blocks: () => {
            const hero = newBlock('hero')
            Object.assign(hero.props, {
                layout: 'centred',
                eyebrow: 'Page not found',
                heading: 'We can’t find that page',
                text: 'It may have moved, or the link might have a typo. Try the home page instead.',
                buttonLabel: 'Go to the home page',
                buttonUrl: '/'
            })
            return [hero]
        }
    },
    {
        key: 'offline',
        path: '/_offline',
        title: 'Offline',
        desc: 'Shown on every address while the site is offline (Settings › Offline or delete). Good as a “coming soon” page.',
        blocks: () => {
            const hero = newBlock('hero')
            Object.assign(hero.props, {
                layout: 'centred',
                eyebrow: 'Back soon',
                heading: 'We’re making a few changes',
                text: 'The site is taking a short break. Please check back soon.',
                buttonLabel: '',
                buttonUrl: ''
            })
            return [hero]
        }
    }
]

export const isSystemPath = (path: string) => SYSTEM_PAGES.some(p => p.path === path)
export const systemPageFor = (path: string) => SYSTEM_PAGES.find(p => p.path === path)
