create table if not exists public.contact_history (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null check (action in ('import_created', 'import_updated', 'manual_updated')),
  source text,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists contact_history_org_contact_created_idx
  on public.contact_history(org_id, contact_id, created_at desc);

alter table public.contact_history enable row level security;

drop policy if exists "contact_history_org_members_select" on public.contact_history;
create policy "contact_history_org_members_select"
  on public.contact_history for select
  using (private.is_org_member(org_id));

drop policy if exists "contact_history_org_members_insert" on public.contact_history;
create policy "contact_history_org_members_insert"
  on public.contact_history for insert
  with check (private.is_org_member(org_id));

grant select, insert on public.contact_history to authenticated;
