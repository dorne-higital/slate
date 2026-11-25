/**
 * Private sign-up links for while Slate is "coming soon": `{expiry}.{signature}`, signed with
 * the auth secret, so nothing is stored. Anyone with an unexpired link can make an account.
 */
const DAYS = 7

async function sign(expiry: string) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`signup-link:${useRuntimeConfig().betterAuthSecret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(expiry)))
    return btoa(String.fromCharCode(...sig)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function makeSignupKey() {
    const expiry = String(Math.floor(Date.now() / 1000) + DAYS * 24 * 3600)
    return { key: `${expiry}.${await sign(expiry)}`, expiresAt: new Date(Number(expiry) * 1000) }
}

export async function signupKeyValid(key: unknown) {
    if (typeof key !== 'string' || key.length > 100) return false
    const [expiry, sig] = key.split('.')
    if (!expiry || !sig || !/^\d+$/.test(expiry) || Number(expiry) * 1000 < Date.now()) return false
    const want = await sign(expiry)
    if (want.length !== sig.length) return false
    let diff = 0
    for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ sig.charCodeAt(i)
    return diff === 0
}

/** Sign-up is open to everyone after launch, or to holders of a private link before it. */
export async function signupOpen(key: unknown) {
    return !useRuntimeConfig().public.comingSoon || await signupKeyValid(key)
}
