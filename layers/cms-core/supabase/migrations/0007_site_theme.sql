-- Per-site color customization for the public site renderer. Stored as
-- jsonb rather than individual columns since it's read/written as one
-- object by the theme editor (pages/sites/[siteId]/themes.vue) and never
-- queried by individual field — same reasoning as pages.blocks.
--
-- A key's absence (or the whole column being null, the default for every
-- existing and new site) means "use the built-in default" — see
-- assets/styles/_site-theme.scss for what those defaults are and
-- BlockRenderer.vue for how a set value overrides one. No column-level
-- shape is enforced here; server/api/sites/[siteId].patch.ts is what
-- validates which keys are accepted.
alter table public.sites
    add column theme jsonb;
