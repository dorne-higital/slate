-- Slate CMS — initial schema
--
-- Access model recap (see README.md "Access control model" for the full
-- explanation):
--   * platform admin  -> profiles.is_platform_admin = true, sees/edits everything
--   * site member     -> a row in site_members(user_id, site_id, role) scopes
--                        that user to exactly that site, at that role
--
-- Every table below has RLS enabled. Nothing is granted to `anon`. Nothing
-- is granted to `authenticated` beyond what's listed explicitly — Supabase
-- does not grant table access by default, so an ungranted table is
-- unreachable even before RLS is considered.
--
-- Sections flagged "SECOND LOOK" are deliberate policy calls that trade
-- off flexibility for a smaller blast radius. Revisit them against your
-- actual product requirements before going to production.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto with schema extensions;

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    full_name text,
    is_platform_admin boolean not null default false,
    created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users row. is_platform_admin is the master-tier flag.';

create table public.sites (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    status text not null default 'active' check (status in ('active', 'paused', 'archived')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.site_members (
    site_id uuid not null references public.sites (id) on delete cascade,
    -- References profiles(id) rather than auth.users(id) directly so
    -- PostgREST can embed profile data (site_members(...profiles(email,
    -- full_name))) — profiles.id already 1:1 mirrors auth.users(id) via
    -- its own FK + the handle_new_user trigger, so this adds no new
    -- integrity risk, just a join path PostgREST can see.
    user_id uuid not null references public.profiles (id) on delete cascade,
    role text not null default 'viewer' check (role in ('owner', 'admin', 'editor', 'viewer')),
    created_at timestamptz not null default now(),
    primary key (site_id, user_id)
);

comment on table public.site_members is 'Join table scoping a user to a site at a role. The only path to site visibility for non-platform-admins.';

create index site_members_user_id_idx on public.site_members (user_id);

create table public.pages (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites (id) on delete cascade,
    parent_id uuid references public.pages (id) on delete cascade,
    title text not null,
    slug text not null,
    status text not null default 'draft' check (status in ('draft', 'published')),
    blocks jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (site_id, parent_id, slug)
);

comment on table public.pages is 'blocks is an ordered JSON array of {id, type, props}. type must match a component_registry.type.';

create index pages_site_id_idx on public.pages (site_id);
create index pages_parent_id_idx on public.pages (parent_id);

create table public.component_registry (
    type text primary key,
    label text not null,
    description text,
    icon text,
    schema jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

comment on table public.component_registry is 'Global block type catalogue (Hero, Rich Text, CTA, ...) shared by every site in this Supabase project. schema drives the page-builder side panel form.';

-- ============================================================================
-- updated_at maintenance
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger sites_set_updated_at
    before update on public.sites
    for each row execute function public.set_updated_at();

create trigger pages_set_updated_at
    before update on public.pages
    for each row execute function public.set_updated_at();

-- ============================================================================
-- New-user provisioning
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, is_platform_admin)
    values (new.id, new.email, false);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ============================================================================
-- RLS helper functions
--
-- SECOND LOOK: these run as SECURITY DEFINER so policies on `profiles` and
-- `site_members` can call them without triggering RLS recursion (a policy
-- on `profiles` that itself queries `profiles` through a non-definer
-- function would re-enter RLS and either recurse or silently see zero
-- rows). search_path is pinned to `public` on every definer function below
-- to prevent search-path hijacking. EXECUTE is revoked from PUBLIC and
-- re-granted only to `authenticated`.
-- ============================================================================

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select coalesce(
        (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
        false
    )
$$;

create or replace function public.site_role_rank(role text)
returns int
language sql
immutable
as $$
    select case role
        when 'owner' then 4
        when 'admin' then 3
        when 'editor' then 2
        when 'viewer' then 1
        else 0
    end
$$;

-- has_site_role: true if the caller is a platform admin, OR holds at least
-- `min_role` on `target_site_id`. Used for both read and write policies —
-- pass 'viewer' for read-only access checks.
create or replace function public.has_site_role(target_site_id uuid, min_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select
        public.is_platform_admin()
        or exists (
            select 1
            from public.site_members sm
            where sm.site_id = target_site_id
              and sm.user_id = auth.uid()
              and public.site_role_rank(sm.role) >= public.site_role_rank(min_role)
        )
$$;

create or replace function public.has_site_access(target_site_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select public.has_site_role(target_site_id, 'viewer')
$$;

revoke execute on function public.is_platform_admin() from public;
revoke execute on function public.has_site_role(uuid, text) from public;
revoke execute on function public.has_site_access(uuid) from public;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.has_site_role(uuid, text) to authenticated;
grant execute on function public.has_site_access(uuid) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.site_members enable row level security;
alter table public.pages enable row level security;
alter table public.component_registry enable row level security;

-- ---- profiles ---------------------------------------------------------

grant select, update on public.profiles to authenticated;

-- SECOND LOOK: is_platform_admin is deliberately NOT in this column list.
-- Column-level GRANT restricts which columns an UPDATE may touch,
-- independent of (and in addition to) the row policy below — this is what
-- stops a user from self-promoting to platform admin via a crafted
-- update, since no RLS USING/CHECK clause alone can safely prevent a
-- column-level change without a fragile OLD-vs-NEW subquery. Promoting a
-- user to platform admin is intentionally left as a service-role-only
-- operation (Supabase dashboard SQL editor or a service-role script).
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy profiles_select on public.profiles
    for select
    to authenticated
    using (id = auth.uid() or public.is_platform_admin());

create policy profiles_update_self on public.profiles
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

-- ---- sites --------------------------------------------------------------

grant select, insert, update, delete on public.sites to authenticated;

create policy sites_select on public.sites
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(id));

-- SECOND LOOK: only platform admins provision new sites. If you want site
-- owners to self-serve new sites, relax this to also allow insert and add
-- an application-level step that creates the owner's site_members row in
-- the same transaction.
create policy sites_insert on public.sites
    for insert
    to authenticated
    with check (public.is_platform_admin());

create policy sites_update on public.sites
    for update
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(id, 'admin'))
    with check (public.is_platform_admin() or public.has_site_role(id, 'admin'));

-- SECOND LOOK: delete is platform-admin only, deliberately excluding even
-- a site's own 'owner' role — deleting a site is destructive and cross-
-- cutting (cascades to pages, site_members) so it stays a master-tier
-- action. Revisit if site owners should be able to self-delete.
create policy sites_delete on public.sites
    for delete
    to authenticated
    using (public.is_platform_admin());

-- ---- site_members ---------------------------------------------------------

grant select, insert, update, delete on public.site_members to authenticated;

create policy site_members_select on public.site_members
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(site_id));

-- SECOND LOOK: membership writes (invite, role change, remove) require
-- 'owner' on that site, not merely 'admin' — this intentionally prevents
-- an 'admin' member from promoting themselves or a collaborator to
-- 'owner', or removing the actual owner. Platform admins always bypass.
-- If your product wants admins to manage membership too, loosen the
-- min_role argument below to 'admin', but consider also blocking role
-- changes that target 'owner' specifically.
create policy site_members_insert on public.site_members
    for insert
    to authenticated
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'owner'));

create policy site_members_update on public.site_members
    for update
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'owner'))
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'owner'));

-- Members may remove themselves (leave a site) in addition to owner/admin-
-- initiated removal.
create policy site_members_delete on public.site_members
    for delete
    to authenticated
    using (
        public.is_platform_admin()
        or public.has_site_role(site_id, 'owner')
        or user_id = auth.uid()
    );

-- ---- pages ----------------------------------------------------------------

grant select, insert, update, delete on public.pages to authenticated;

create policy pages_select on public.pages
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(site_id));

-- SECOND LOOK: write access (insert/update/delete) requires 'editor' or
-- above, so 'viewer' members are strictly read-only. Confirm this matches
-- the intended viewer semantics before relying on it.
create policy pages_insert on public.pages
    for insert
    to authenticated
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

create policy pages_update on public.pages
    for update
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'editor'))
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

create policy pages_delete on public.pages
    for delete
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

-- ---- component_registry ----------------------------------------------------

grant select on public.component_registry to authenticated;
grant insert, update, delete on public.component_registry to authenticated;

-- Any authenticated user may read the block catalogue (needed to render
-- the page builder for any site they belong to). Only platform admins
-- may define new block types, since this table is shared across every
-- site in the project.
create policy component_registry_select on public.component_registry
    for select
    to authenticated
    using (true);

create policy component_registry_insert on public.component_registry
    for insert
    to authenticated
    with check (public.is_platform_admin());

create policy component_registry_update on public.component_registry
    for update
    to authenticated
    using (public.is_platform_admin())
    with check (public.is_platform_admin());

create policy component_registry_delete on public.component_registry
    for delete
    to authenticated
    using (public.is_platform_admin());

-- ============================================================================
-- Seed: baseline block types
-- ============================================================================

insert into public.component_registry (type, label, description, icon, schema) values
    (
        'hero',
        'Hero',
        'Full-width intro section with heading, subheading, and optional background image.',
        'i-heroicons-photo',
        '[
            {"key": "heading", "label": "Heading", "kind": "text", "required": true},
            {"key": "subheading", "label": "Subheading", "kind": "textarea"},
            {"key": "image", "label": "Background image", "kind": "image"},
            {"key": "ctaLabel", "label": "Button label", "kind": "text"},
            {"key": "ctaUrl", "label": "Button link", "kind": "url"}
        ]'::jsonb
    ),
    (
        'rich-text',
        'Rich Text',
        'Freeform formatted text content.',
        'i-heroicons-document-text',
        '[
            {"key": "html", "label": "Content", "kind": "richtext", "required": true}
        ]'::jsonb
    ),
    (
        'cta',
        'Call to Action',
        'Heading, short copy, and a single button.',
        'i-heroicons-megaphone',
        '[
            {"key": "heading", "label": "Heading", "kind": "text", "required": true},
            {"key": "body", "label": "Body", "kind": "textarea"},
            {"key": "buttonLabel", "label": "Button label", "kind": "text", "required": true},
            {"key": "buttonUrl", "label": "Button link", "kind": "url", "required": true}
        ]'::jsonb
    );
