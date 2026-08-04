-- The page builder no longer has a Publish/Unpublish control (removed in
-- favor of a single Save that's always live — see pages/sites/[siteId]/
-- pages/[pageId].vue), so a page stuck in draft status had no remaining
-- way to ever become visible to a real visitor, permanently 404ing on
-- the public site. This drops the draft/published distinction from the
-- public-read gate entirely — any page belonging to an active site is
-- publicly visible now, same as if it had always been "published".
--
-- The `status` column itself is left in place (server/api/site-dashboard
-- .get.ts still reports published/draft counts, and nothing here forces
-- an app-layer migration of existing rows), only this policy changes.

drop policy if exists pages_public_select on public.pages;

create policy pages_public_select on public.pages
    for select
    to anon
    using (exists (
        select 1 from public.sites
        where sites.id = pages.site_id and sites.status = 'active'
    ));
