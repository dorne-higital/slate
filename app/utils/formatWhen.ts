/** "12 minutes ago", "Today, 15:48", "Yesterday", "19 Nov" */
export function formatWhen(iso: string): string {
    const d = new Date(iso)
    const now = new Date()
    const mins = Math.round((now.getTime() - d.getTime()) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
    const sameDay = d.toDateString() === now.toDateString()
    if (sameDay) return `Today, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
