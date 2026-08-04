export interface SocialPlatformOption {
    value: string
    label: string
    fieldLabel: string
    placeholder: string
}

export const SOCIAL_PLATFORMS: SocialPlatformOption[] = [
    { value: 'facebook', label: 'Facebook', fieldLabel: 'Page URL', placeholder: 'https://facebook.com/yourpage' },
    { value: 'instagram', label: 'Instagram', fieldLabel: 'Profile URL', placeholder: 'https://instagram.com/yourhandle' },
    { value: 'tiktok', label: 'TikTok', fieldLabel: 'Profile URL', placeholder: 'https://tiktok.com/@yourhandle' },
    { value: 'linkedin', label: 'LinkedIn', fieldLabel: 'Page URL', placeholder: 'https://linkedin.com/company/yourcompany' },
    { value: 'whatsapp', label: 'WhatsApp', fieldLabel: 'WhatsApp number', placeholder: '+44 7123 456789' },
    { value: 'pinterest', label: 'Pinterest', fieldLabel: 'Profile URL', placeholder: 'https://pinterest.com/yourprofile' },
    { value: 'youtube', label: 'YouTube', fieldLabel: 'Channel URL', placeholder: 'https://youtube.com/@yourchannel' },
    { value: 'other', label: 'Other', fieldLabel: 'Link', placeholder: 'https://…' }
]

export function socialPlatformLabel(value: string): string {
    return SOCIAL_PLATFORMS.find(platform => platform.value === value)?.label ?? value
}
