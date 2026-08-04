-- Site-wide navigation: a per-site "layout" choice (which header/footer
-- style renders on the public site) plus the menus that feed them.
--
-- `menus.slot` is what a header/footer style actually renders — a
-- "Default" header looks for the site's 'header_main' menu, a "Default"
-- footer looks for 'footer_main' and 'footer_legal'. One menu per slot
-- per site keeps that lookup unambiguous (no "which one did they mean").
-- `items` is a nested jsonb tree ({id, label, url, newTab, children[]}),
-- same shape choice as pages.blocks — an ordered, arbitrarily-nested
-- structure with no fixed depth doesn't need a relational table of its
-- own, and it's small enough that read-modify-write-whole-menu on save
-- (same pattern the page builder already uses for blocks) is plenty.

alter table public.sites add column layout jsonb;

comment on column public.sites.layout is 'Chosen header/footer style keys, e.g. {"header": "default", "footer": "default"}. An unset key (or the whole column being null) means "use the built-in default" — same convention as sites.theme.';

create table public.menus (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites (id) on delete cascade,
    name text not null,
    slug text not null,
    slot text not null check (slot in ('header_main', 'footer_main', 'footer_legal')),
    items jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (site_id, slug),
    unique (site_id, slot)
);

comment on table public.menus is 'Named navigation trees a site''s chosen header/footer style renders. items is an ordered, nested [{id, label, url, newTab, children}] tree.';

create index menus_site_id_idx on public.menus (site_id);

create trigger menus_set_updated_at
    before update on public.menus
    for each row execute function public.set_updated_at();

alter table public.menus enable row level security;

grant select, insert, update, delete on public.menus to authenticated;

create policy menus_select on public.menus
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(site_id));

create policy menus_insert on public.menus
    for insert
    to authenticated
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

create policy menus_update on public.menus
    for update
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

create policy menus_delete on public.menus
    for delete
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

-- Public read for the site renderer — same shape as sites_public_select/
-- pages_public_select in 0005_public_site_access.sql, joined through
-- since menus has no status column of its own to check directly.
grant select on public.menus to anon;

create policy menus_public_select on public.menus
    for select
    to anon
    using (exists (
        select 1 from public.sites
        where sites.id = menus.site_id and sites.status = 'active'
    ));
