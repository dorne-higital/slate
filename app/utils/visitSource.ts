/** The first-visit source this browser saved (see plugins/slate-analytics.client.ts), to send with a sign-up. */
export function savedVisitSource(): VisitSource | null {
    try {
        return JSON.parse(localStorage.getItem('slate-source') ?? 'null')
    } catch {
        return null
    }
}
