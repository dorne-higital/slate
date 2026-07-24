-- Page-level SEO fields, plus component_registry updates for the page
-- builder redesign: friendlier field labels on the original three block
-- types, and two additional block types (Image Gallery, Testimonial).

alter table public.pages
    add column seo_title text,
    add column seo_description text;

-- Image Gallery stores image URLs as one-per-line text rather than a
-- proper repeating-field UI (which BlockFieldSchema doesn't support yet)
-- — a deliberate v1 simplification, not an oversight.
update public.component_registry
set label = 'Hero Banner',
    schema = '[
        {"key": "heading", "label": "Headline", "kind": "text", "required": true},
        {"key": "subheading", "label": "Subtext", "kind": "textarea"},
        {"key": "image", "label": "Background image", "kind": "image"},
        {"key": "ctaLabel", "label": "Button label", "kind": "text"},
        {"key": "ctaUrl", "label": "Button link", "kind": "url"}
    ]'::jsonb
where type = 'hero';

update public.component_registry
set label = 'Text Block',
    schema = '[
        {"key": "html", "label": "Content", "kind": "richtext", "required": true}
    ]'::jsonb
where type = 'rich-text';

update public.component_registry
set label = 'CTA Banner',
    schema = '[
        {"key": "heading", "label": "Headline", "kind": "text", "required": true},
        {"key": "body", "label": "Subtext", "kind": "textarea"},
        {"key": "buttonLabel", "label": "Button label", "kind": "text", "required": true},
        {"key": "buttonUrl", "label": "Button link", "kind": "url", "required": true}
    ]'::jsonb
where type = 'cta';

insert into public.component_registry (type, label, description, icon, schema) values
    (
        'image-gallery',
        'Image Gallery',
        'A row of images. One URL per line.',
        'i-heroicons-photo',
        '[
            {"key": "images", "label": "Image URLs (one per line)", "kind": "textarea", "required": true}
        ]'::jsonb
    ),
    (
        'testimonial',
        'Testimonial',
        'A quote with an attributed author.',
        'i-heroicons-chat-bubble-left-right',
        '[
            {"key": "quote", "label": "Quote", "kind": "textarea", "required": true},
            {"key": "authorName", "label": "Author name", "kind": "text", "required": true},
            {"key": "authorRole", "label": "Author role", "kind": "text"}
        ]'::jsonb
    )
on conflict (type) do update
set label = excluded.label,
    description = excluded.description,
    icon = excluded.icon,
    schema = excluded.schema;
