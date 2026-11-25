/** Line icons for the feature grid block (24×24, drawn with a 2px stroke, no fill). */
export const SHOWCASE_ICONS: { key: string, label: string, path: string }[] = [
    { key: 'star', label: 'Star', path: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z' },
    { key: 'bolt', label: 'Lightning (fast)', path: 'M13 2L4 14h7l-1 8 9-12h-7z' },
    { key: 'heart', label: 'Heart', path: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
    { key: 'clock', label: 'Clock', path: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
    { key: 'lock', label: 'Padlock', path: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5z' },
    { key: 'shield', label: 'Shield (safe)', path: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
    { key: 'bell', label: 'Bell (reminders)', path: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4' },
    { key: 'chart', label: 'Chart (progress)', path: 'M4 20V11M10 20V5M16 20v-7M2 20h20' },
    { key: 'pin', label: 'Map pin', path: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
    { key: 'people', label: 'People', path: 'M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
    { key: 'chat', label: 'Chat', path: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z' },
    { key: 'calendar', label: 'Calendar', path: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4' },
    { key: 'camera', label: 'Camera', path: 'M3 8h4l2-3h6l2 3h4v12H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { key: 'phone', label: 'Phone', path: 'M7 2h10v20H7zM11 18h2' },
    { key: 'globe', label: 'Globe', path: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18' },
    { key: 'leaf', label: 'Leaf', path: 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15zM5 19l8-8' },
    { key: 'gift', label: 'Gift', path: 'M3 9h18v4H3zM5 13v8h14v-8M12 9v12M12 9S10 3 7 4.5 9 9 12 9zM12 9s2-6 5-4.5S15 9 12 9z' },
    { key: 'tick', label: 'Tick', path: 'M5 12l5 5 9-10' }
]

export function showcaseIcon(key: string | undefined) {
    return (SHOWCASE_ICONS.find(i => i.key === key) ?? SHOWCASE_ICONS[0]!).path
}
