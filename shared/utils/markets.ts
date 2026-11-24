/**
 * Where Slate sells. UK only for now: selling online services to consumers in EU countries means charging
 * that country's VAT from the first sale, so EU sign-ups wait until Slate is set up for it.
 */
export const SELL_TO: { code: string, name: string }[] = [
    { code: 'GB', name: 'United Kingdom' },
    { code: 'IM', name: 'Isle of Man' },
    { code: 'JE', name: 'Jersey' },
    { code: 'GG', name: 'Guernsey' }
]
export const sellsTo = (code: unknown) => SELL_TO.some(c => c.code === code)
export const NOT_SELLING_MESSAGE = 'Slate is only available to businesses based in the UK for now. Email hello@slatecms.co.uk and we’ll let you know when that changes.'
