-- Address, opening hours, and social links — same optional-JSONB-blob
-- convention as theme/layout/branding. Purely informational storage for
-- now; nothing renders this on the public site yet (that's a separate,
-- later decision about where/how — e.g. a footer block).

alter table public.sites add column company_info jsonb;

comment on column public.sites.company_info is 'e.g. {"address": "...", "openingHours": {"monday": "9am - 5pm", ...}, "socials": [{"id": "...", "platform": "Instagram", "url": "..."}]}.';
