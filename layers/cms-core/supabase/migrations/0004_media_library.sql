-- Media library: a Supabase Storage bucket plus a metadata table, so image
-- fields can be picked from an uploaded library instead of a typed-in URL.
--
-- Storage objects are stored as `{site_id}/{uuid}-{filename}` — the site_id
-- folder segment is what the storage.objects RLS policies below key off,
-- via storage.foldername(name), reusing the same is_platform_admin()/
-- has_site_role() functions every other table's policies use.

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create table public.media (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites (id) on delete cascade,
    path text not null unique,
    filename text not null,
    mime_type text not null,
    size_bytes bigint not null,
    uploaded_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

comment on table public.media is 'Metadata for files in the `media` storage bucket. path is the object key within that bucket.';

create index media_site_id_created_at_idx on public.media (site_id, created_at desc);

alter table public.media enable row level security;

grant select, insert, delete on public.media to authenticated;

create policy media_select on public.media
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(site_id));

create policy media_insert on public.media
    for insert
    to authenticated
    with check (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

create policy media_delete on public.media
    for delete
    to authenticated
    using (public.is_platform_admin() or public.has_site_role(site_id, 'editor'));

-- ============================================================================
-- Storage RLS — the bucket is public (so published pages can serve images
-- without an auth round-trip), but writes and authenticated listing still
-- go through these policies exactly like every other table.
-- ============================================================================

create policy media_storage_select on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'media'
        and (
            public.is_platform_admin()
            or public.has_site_access((storage.foldername(name))[1]::uuid)
        )
    );

create policy media_storage_insert on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'media'
        and (
            public.is_platform_admin()
            or public.has_site_role((storage.foldername(name))[1]::uuid, 'editor')
        )
    );

create policy media_storage_delete on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'media'
        and (
            public.is_platform_admin()
            or public.has_site_role((storage.foldername(name))[1]::uuid, 'editor')
        )
    );
