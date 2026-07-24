-- Public read access for the site renderer.
--
-- Every policy so far has been membership-gated (is_platform_admin() or
-- has_site_access()) because every reader so far has been a logged-in
-- dashboard user. A real site visitor has no Supabase session at all —
-- they hit the `anon` role — so none of those policies apply to them,
-- and `anon` doesn't even have a table-level GRANT yet. Both are needed
-- for the public renderer to work.
--
-- This is additive: RLS policies for the same command OR together, so
-- these sit alongside (not instead of) the existing membership policies.
-- A logged-in editor still sees their own site's drafts exactly as
-- before; anyone (including someone not logged in at all) can now also
-- see *published* pages of *active* sites, which is the whole point of
-- publishing something.

grant select on public.sites to anon;
grant select on public.pages to anon;

create policy sites_public_select on public.sites
    for select
    using (status = 'active');

create policy pages_public_select on public.pages
    for select
    using (status = 'published');
