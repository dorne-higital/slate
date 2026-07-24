// Maps component_registry.type -> the Vue component that renders it.
// Shared by BlockRenderer (public/preview rendering) and the page builder
// canvas (editor rendering) so the two never drift apart.
export const BLOCK_COMPONENTS: Record<string, string> = {
    hero: 'BlockHero',
    'rich-text': 'BlockRichText',
    cta: 'BlockCta',
    'image-gallery': 'BlockImageGallery',
    testimonial: 'BlockTestimonial'
}

export function resolveBlockComponent(type: string) {
    return BLOCK_COMPONENTS[type]
}
