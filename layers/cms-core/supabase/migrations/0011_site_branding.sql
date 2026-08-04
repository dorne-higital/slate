-- Per-site logo(s) and favicon — same "optional JSONB blob on sites,
-- unset means no override" convention as theme/layout.

alter table public.sites add column branding jsonb;

comment on column public.sites.branding is 'Logo/favicon media URLs, e.g. {"logoLight": "...", "logoDark": "...", "favicon": "..."}. logoDark is optional — only the default (light-background) header/footer style exists today, so it is stored for when a dark-background style variant is added, not rendered yet.';
