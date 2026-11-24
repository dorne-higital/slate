import type { H3Event } from 'h3'

/**
 * Checks a Cloudflare Turnstile token (the invisible "are you human" check on sign-up, login and
 * password reset). With no secret configured (e.g. before the widget is set up) it lets everything
 * through, so the site keeps working.
 */
export async function verifyTurnstile(token: string | null | undefined, ip?: string | null): Promise<boolean> {
    const secret = useRuntimeConfig().turnstileSecret
    if (!secret) return true
    if (!token) return false
    try {
        const body = new URLSearchParams({ secret, response: token })
        if (ip) body.set('remoteip', ip)
        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
        const data = await res.json() as { success?: boolean }
        return data.success === true
    } catch {
        // Cloudflare unreachable: don't lock everyone out
        console.error('[turnstile] verify failed to reach Cloudflare')
        return true
    }
}

export const requestIp = (event: H3Event) => getRequestHeader(event, 'cf-connecting-ip') || getRequestIP(event, { xForwardedFor: true }) || null

export const TURNSTILE_FAILED = 'Please confirm you’re not a robot, then try again.'
