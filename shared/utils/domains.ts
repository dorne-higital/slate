/**
 * Cleans up what someone types into "Connect a domain":
 * "https://www.Bramble.co.uk/about" → "www.bramble.co.uk". Returns null if it isn't a usable domain.
 */
export function normaliseDomain(input: string): string | null {
    const host = input.trim().toLowerCase()
        .replace(/^[a-z]+:\/\//, '')
        .replace(/[/?#].*$/, '')
        .replace(/:\d+$/, '')
        .replace(/\.$/, '')
    if (host.length > 253 || !host.includes('.')) return null
    if (/^\d+(\.\d+){3}$/.test(host)) return null
    const label = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/
    const parts = host.split('.')
    if (!parts.every(p => label.test(p)) || !/^[a-z]{2,}$/.test(parts[parts.length - 1]!)) return null
    return host
}

/** The pair of hostnames we connect for a domain: bramble.co.uk and www.bramble.co.uk. */
export function domainPair(host: string): string[] {
    const bare = host.replace(/^www\./, '')
    // bramble.co.uk is a whole domain (3 labels); bramble.com is too (2). Anything longer, like
    // shop.bramble.co.uk, is a subdomain and gets connected on its own, without a www twin.
    const registrableLabels = /\.(co|org|ac|gov|me|net|ltd|plc|com)\.[a-z]{2}$/.test(bare) ? 3 : 2
    const isSubdomain = !host.startsWith('www.') && bare.split('.').length > registrableLabels
    return isSubdomain ? [host] : [bare, `www.${bare}`]
}
