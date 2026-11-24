/** Throwaway inboxes people use to dodge sign-up checks. Not exhaustive: the common ones. */
const DISPOSABLE = new Set([
    'mailinator.com', 'guerrillamail.com', 'guerrillamail.net', 'sharklasers.com', '10minutemail.com', 'temp-mail.org', 'tempmail.com',
    'yopmail.com', 'trashmail.com', 'getnada.com', 'dispostable.com', 'maildrop.cc', 'throwawaymail.com', 'fakeinbox.com', 'tempail.com',
    'mintemail.com', 'mohmal.com', 'emailondeck.com', 'spamgourmet.com', 'mailnesia.com', 'tempr.email', 'discard.email', 'burnermail.io'
])

/** Domains we never look up (they're for tests and examples). */
const RESERVED = /(^|\.)(example\.(com|org|net)|test|invalid|localhost)$/i

/**
 * Catches typos and fake addresses before an account is made: the domain must be able to
 * receive email (has MX or A records) and mustn't be a throwaway inbox service.
 * Returns a message to show, or null if it looks fine. If DNS can't be reached, it passes.
 */
export async function checkEmailAddress(email: string): Promise<string | null> {
    const domain = email.split('@')[1]?.toLowerCase() ?? ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'That email address doesn’t look right.'
    if (DISPOSABLE.has(domain)) return 'Please use your own email address, not a temporary one.'
    if (RESERVED.test(domain)) return null
    const lookup = async (type: 'MX' | 'A') => {
        // Cloudflare's public DNS over HTTPS; never let a slow lookup hold up sign-up
        const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=${type}`, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(3000) })
        const data = await res.json() as { Status?: number, Answer?: unknown[] }
        return data.Status === 0 && (data.Answer?.length ?? 0) > 0
    }
    try {
        if (await lookup('MX') || await lookup('A')) return null
        return `We can’t find ${domain}. Check your email address for typos.`
    } catch {
        return null
    }
}
