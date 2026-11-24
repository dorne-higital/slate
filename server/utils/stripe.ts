/** Minimal Stripe API client over fetch (works on Workers without the SDK). */

type Params = Record<string, unknown>

/** Stripe's form encoding: { a: { b: 1 }, c: [x, y] } → a[b]=1&c[0]=x&c[1]=y */
function encode(params: Params, prefix = '', out = new URLSearchParams()) {
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue
        const key = prefix ? `${prefix}[${k}]` : k
        if (Array.isArray(v)) {
            v.forEach((item, i) => {
                if (item !== null && typeof item === 'object') encode(item as Params, `${key}[${i}]`, out)
                else out.append(`${key}[${i}]`, String(item))
            })
        } else if (typeof v === 'object') {
            encode(v as Params, key, out)
        } else {
            out.append(key, String(v))
        }
    }
    return out
}

export function stripeConfigured() {
    return !!useRuntimeConfig().stripeSecretKey
}

export async function stripe<T = Record<string, any>>(method: 'GET' | 'POST' | 'DELETE', path: string, params: Params = {}): Promise<T> {
    const key = useRuntimeConfig().stripeSecretKey
    if (!key) throw createError({ statusCode: 503, statusMessage: 'Billing isn’t set up yet' })
    const body = encode(params)
    const url = `https://api.stripe.com/v1/${path}${method === 'GET' && body.size ? `?${body}` : ''}`
    const res = await fetch(url, {
        method,
        headers: { 'authorization': `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded', 'stripe-version': '2024-06-20' },
        body: method === 'GET' ? undefined : body
    })
    const data = await res.json() as T & { error?: { message?: string } }
    if (!res.ok) {
        console.error('[stripe]', method, path, res.status, data.error?.message)
        throw createError({ statusCode: 502, statusMessage: 'Our payment provider didn’t respond as expected. Please try again in a minute.' })
    }
    return data
}

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')

/** Checks a Stripe-Signature header (v1 HMAC-SHA256, 5-minute tolerance). */
export async function verifyStripeSignature(payload: string, header: string | undefined, secret: string) {
    if (!header || !secret) return false
    const parts = Object.fromEntries(header.split(',').map(p => p.split('=') as [string, string]))
    const t = Number(parts.t)
    if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false
    const signatures = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3))
    const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const expected = toHex(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${t}.${payload}`)))
    // Constant-time compare
    return signatures.some((sig) => {
        if (sig.length !== expected.length) return false
        let diff = 0
        for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i)
        return diff === 0
    })
}
