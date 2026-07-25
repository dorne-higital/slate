import type { SiteTheme } from '../types'

export interface SiteThemePreset {
    name: string
    theme: SiteTheme
}

// Each preset only sets the "core" fields (surfaces, text, brand, links,
// borders, radius, fonts) — button colors are deliberately left unset,
// since _site-theme.scss's --site-button-* defaults already derive from
// --site-brand-primary/secondary/accent via var() (see that file), so
// they pick up a preset's brand colors automatically without needing to
// be repeated here.
export const THEME_PRESETS: SiteThemePreset[] = [
    {
        name: 'Modern',
        theme: {
            bgPrimary: '#f7f8fa',
            bgSecondary: '#ffffff',
            textPrimary: '#14181f',
            textSecondary: '#5b6472',
            textInverse: '#ffffff',
            brandPrimary: '#3b82f6',
            brandSecondary: '#2563eb',
            brandAccent: '#dbeafe',
            link: '#3b82f6',
            linkHover: '#2563eb',
            border: '#e2e5ea',
            borderStrong: '#c7ccd4',
            headingFontFamily: "'Inter', sans-serif",
            bodyFontFamily: "'Inter', sans-serif",
            borderRadiusSm: '6px',
            borderRadiusMd: '12px',
            borderRadiusLg: '20px',
            borderRadiusPill: '999px'
        }
    },
    {
        name: 'Playful',
        theme: {
            bgPrimary: '#fff8f0',
            bgSecondary: '#ffffff',
            textPrimary: '#2d1b0e',
            textSecondary: '#8a6f5c',
            textInverse: '#ffffff',
            brandPrimary: '#ff6b6b',
            brandSecondary: '#ee5253',
            brandAccent: '#ffe3e3',
            link: '#ff6b6b',
            linkHover: '#ee5253',
            border: '#f3ddd0',
            borderStrong: '#e0c2ad',
            headingFontFamily: "'Poppins', sans-serif",
            bodyFontFamily: "'Nunito', sans-serif",
            borderRadiusSm: '10px',
            borderRadiusMd: '16px',
            borderRadiusLg: '24px',
            borderRadiusPill: '999px'
        }
    },
    {
        name: 'Business',
        theme: {
            bgPrimary: '#f4f5f7',
            bgSecondary: '#ffffff',
            textPrimary: '#1a1f2b',
            textSecondary: '#5c6577',
            textInverse: '#ffffff',
            brandPrimary: '#1e3a5f',
            brandSecondary: '#16293f',
            brandAccent: '#dce6f0',
            link: '#1e3a5f',
            linkHover: '#16293f',
            border: '#dde1e7',
            borderStrong: '#c3c9d2',
            headingFontFamily: "'Source Serif 4', serif",
            bodyFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            borderRadiusSm: '2px',
            borderRadiusMd: '4px',
            borderRadiusLg: '6px',
            borderRadiusPill: '4px'
        }
    },
    {
        name: 'Dark',
        theme: {
            bgPrimary: '#14151a',
            bgSecondary: '#1e1f26',
            textPrimary: '#f2f2f5',
            textSecondary: '#a3a6b0',
            textInverse: '#14151a',
            brandPrimary: '#22d3ee',
            brandSecondary: '#0ea5c4',
            brandAccent: '#164e58',
            link: '#22d3ee',
            linkHover: '#67e3f5',
            border: '#2c2e38',
            borderStrong: '#3f4250',
            headingFontFamily: "'Space Grotesk', sans-serif",
            bodyFontFamily: "'Inter', sans-serif",
            borderRadiusSm: '6px',
            borderRadiusMd: '10px',
            borderRadiusLg: '16px',
            borderRadiusPill: '999px'
        }
    },
    {
        name: 'Editorial',
        theme: {
            bgPrimary: '#faf9f7',
            bgSecondary: '#ffffff',
            textPrimary: '#1c1917',
            textSecondary: '#6b625b',
            textInverse: '#ffffff',
            brandPrimary: '#7c2d12',
            brandSecondary: '#5c2109',
            brandAccent: '#fde8dc',
            link: '#7c2d12',
            linkHover: '#5c2109',
            border: '#e7e2dc',
            borderStrong: '#d1c9c0',
            headingFontFamily: "'Playfair Display', serif",
            bodyFontFamily: "'Lora', serif",
            borderRadiusSm: '0px',
            borderRadiusMd: '2px',
            borderRadiusLg: '4px',
            borderRadiusPill: '2px'
        }
    }
]
