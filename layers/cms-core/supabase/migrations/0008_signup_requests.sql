-- Public "register interest" leads. No self-serve signup — a platform
-- admin reviews each request and converts it into a real site + invited
-- user (see server/api/admin/signup-requests/[id]/convert.post.ts).
--
-- This is the one table in the whole schema that grants `insert` to
-- `anon` for something that isn't already-published content (compare
-- 0005_public_site_access.sql, which only grants anon *read* access) —
-- the /register page has no session to attach the request to. The
-- WITH CHECK below is deliberately strict about it: an anonymous caller
-- can only ever create a brand-new, unconverted request, never touch an
-- existing one (no anon UPDATE grant at all) or fabricate one that looks
-- already-processed.

create table public.signup_requests (
    id uuid primary key default gen_random_uuid(),
    first_name text not null,
    last_name text not null,
    email text not null,
    phone text,
    site_name text not null,
    plan text not null check (plan in ('free', 'pro', 'business')),
    status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'dismissed')),
    converted_site_id uuid references public.sites (id) on delete set null,
    created_at timestamptz not null default now()
);

comment on table public.signup_requests is 'Public "register interest" submissions, reviewed and converted by a platform admin — see README "Self-serve" note.';

alter table public.signup_requests enable row level security;

grant select, update on public.signup_requests to authenticated;
grant insert on public.signup_requests to anon, authenticated;

create policy signup_requests_insert on public.signup_requests
    for insert
    to anon, authenticated
    with check (status = 'new' and converted_site_id is null);

-- SECOND LOOK: select/update are platform-admin only — a signup request
-- contains a stranger's name/email/phone before they have any account or
-- membership row to scope access through, so has_site_access() has
-- nothing to check against here; is_platform_admin() is the only lever.
create policy signup_requests_select on public.signup_requests
    for select
    to authenticated
    using (public.is_platform_admin());

create policy signup_requests_update on public.signup_requests
    for update
    to authenticated
    using (public.is_platform_admin())
    with check (public.is_platform_admin());
