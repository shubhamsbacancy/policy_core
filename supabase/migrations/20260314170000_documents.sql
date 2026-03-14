begin;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  content_type text,
  size_bytes bigint,
  document_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create index if not exists documents_entity_idx on public.documents (org_id, entity_type, entity_id);
create index if not exists documents_org_created_idx on public.documents (org_id, created_at desc);

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row
execute function public.set_updated_at();

alter table public.documents enable row level security;
drop policy if exists documents_select on public.documents;
drop policy if exists documents_insert on public.documents;
drop policy if exists documents_update on public.documents;
drop policy if exists documents_delete on public.documents;
create policy documents_select on public.documents
for select using (public.user_has_org_access(org_id));
create policy documents_insert on public.documents
for insert with check (public.user_has_org_access(org_id));
create policy documents_update on public.documents
for update using (public.user_has_org_access(org_id))
with check (public.user_has_org_access(org_id));
create policy documents_delete on public.documents
for delete using (public.user_has_org_access(org_id));

-- Create the storage bucket (safe no-op if storage is unavailable or bucket exists).
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('documents', 'documents', false)
    on conflict (id) do nothing;
  end if;
exception when others then
  -- Supabase projects have storage by default; ignore if unavailable.
  null;
end;
$$;

commit;

