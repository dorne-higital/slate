-- Site activity / audit log.
--
-- audit_log rows are never written directly by a client — only the
-- log_page_change() trigger function inserts into this table, and it does
-- so as SECURITY DEFINER, so `authenticated` gets SELECT only (see grants
-- below). This is deliberate: an audit trail that clients can write to
-- directly isn't trustworthy.
--
-- actor_id is a nullable FK (set null on user deletion) so historical rows
-- survive account deletion; actor_email is a snapshot taken at write time
-- for the same reason — a deleted user's audit history should stay
-- readable even after their profile row is gone.

create table public.audit_log (
    id uuid primary key default gen_random_uuid(),
    site_id uuid not null references public.sites (id) on delete cascade,
    actor_id uuid references public.profiles (id) on delete set null,
    actor_email text,
    action text not null check (action in ('insert', 'update', 'delete')),
    entity_type text not null,
    entity_id uuid not null,
    entity_label text,
    created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Append-only activity feed. Written exclusively by SECURITY DEFINER triggers, never directly by clients.';

create index audit_log_site_id_created_at_idx on public.audit_log (site_id, created_at desc);

alter table public.audit_log enable row level security;

-- Read-only grant: no insert/update/delete for `authenticated` at all, so
-- there is no query shape — RLS bypass or not — that lets a client forge
-- or tamper with a log entry.
grant select on public.audit_log to authenticated;

create policy audit_log_select on public.audit_log
    for select
    to authenticated
    using (public.is_platform_admin() or public.has_site_access(site_id));

-- ============================================================================
-- Trigger: log every insert/update/delete on pages
-- ============================================================================

create or replace function public.log_page_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_site_id uuid;
    v_label text;
begin
    if tg_op = 'DELETE' then
        v_site_id := old.site_id;
        v_label := old.title;
    else
        v_site_id := new.site_id;
        v_label := new.title;
    end if;

    insert into public.audit_log (site_id, actor_id, actor_email, action, entity_type, entity_id, entity_label)
    values (
        v_site_id,
        auth.uid(),
        (select p.email from public.profiles p where p.id = auth.uid()),
        lower(tg_op),
        'page',
        coalesce(new.id, old.id),
        v_label
    );

    return coalesce(new, old);
end;
$$;

create trigger pages_audit_log
    after insert or update or delete on public.pages
    for each row execute function public.log_page_change();
