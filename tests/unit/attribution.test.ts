import { describe, expect, it } from 'vitest'
import { cleanSource, sourceLabel } from '../../shared/utils/attribution'

describe('where visitors came from', () => {
    it('keeps only short, known fields', () => {
        expect(cleanSource({ ref: 'www.google.co.uk', landing: '/websites-for/plumbers', utm: 'newsletter', at: '2026-11-26T10:00:00Z', evil: 'x' }))
            .toEqual({ ref: 'www.google.co.uk', landing: '/websites-for/plumbers', utm: 'newsletter', at: '2026-11-26T10:00:00Z' })
        expect(cleanSource({ ref: 'a'.repeat(500) })!.ref!.length).toBeLessThanOrEqual(120)
        expect(cleanSource({ landing: 'javascript:alert(1)' })).toBeNull()
        expect(cleanSource('nope')).toBeNull()
        expect(cleanSource(null)).toBeNull()
    })

    it('names the source in plain words', () => {
        expect(sourceLabel({ ref: 'www.google.co.uk' })).toBe('Google')
        expect(sourceLabel({ ref: 'l.facebook.com' })).toBe('Facebook')
        expect(sourceLabel({ ref: 'lm.instagram.com' })).toBe('Instagram')
        expect(sourceLabel({ ref: 'chatgpt.com' })).toBe('ChatGPT')
        expect(sourceLabel({ ref: 'someblog.co.uk' })).toBe('someblog.co.uk')
        expect(sourceLabel({ utm: 'newsletter', ref: 'www.google.com' })).toBe('Campaign: newsletter')
        expect(sourceLabel({})).toBe('Direct or unknown')
        expect(sourceLabel(null)).toBe('Not recorded')
    })
})

describe('tallying sources', () => {
    it('groups by label, counts paying, biggest first', async () => {
        const { tallySources } = await import('../../shared/utils/attribution')
        expect(tallySources([
            { source: { ref: 'www.google.com' }, paying: true },
            { source: { ref: 'www.google.co.uk' } },
            { source: { ref: 'l.facebook.com' }, paying: false },
            { source: null }
        ])).toEqual([
            { label: 'Google', count: 2, paying: 1 },
            { label: 'Facebook', count: 1, paying: 0 },
            { label: 'Not recorded', count: 1, paying: 0 }
        ])
    })
})
