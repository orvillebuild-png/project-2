alter table public.orgs
  add column if not exists timezone text not null default 'Asia/Manila',
  add column if not exists website_url text,
  add column if not exists address text;

create table if not exists public.sender_domains (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  domain text not null,
  resend_domain_id text,
  status text not null default 'not_started',
  records jsonb not null default '[]'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, domain)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create index if not exists sender_domains_org_id_idx on public.sender_domains(org_id);
create index if not exists team_invitations_org_id_idx on public.team_invitations(org_id);
create index if not exists team_invitations_invited_by_idx on public.team_invitations(invited_by);

alter table public.sender_domains enable row level security;
alter table public.team_invitations enable row level security;

drop policy if exists "sender_domains_visible_to_members" on public.sender_domains;
create policy "sender_domains_visible_to_members"
  on public.sender_domains for select
  using (private.is_org_member(org_id));

drop policy if exists "sender_domains_admins_insert" on public.sender_domains;
create policy "sender_domains_admins_insert"
  on public.sender_domains for insert
  with check (private.is_org_admin(org_id));

drop policy if exists "sender_domains_admins_update" on public.sender_domains;
create policy "sender_domains_admins_update"
  on public.sender_domains for update
  using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

drop policy if exists "sender_domains_admins_delete" on public.sender_domains;
create policy "sender_domains_admins_delete"
  on public.sender_domains for delete
  using (private.is_org_admin(org_id));

drop policy if exists "team_invitations_visible_to_members" on public.team_invitations;
create policy "team_invitations_visible_to_members"
  on public.team_invitations for select
  using (private.is_org_member(org_id));

drop policy if exists "team_invitations_admins_insert" on public.team_invitations;
create policy "team_invitations_admins_insert"
  on public.team_invitations for insert
  with check (private.is_org_admin(org_id));

drop policy if exists "team_invitations_admins_update" on public.team_invitations;
create policy "team_invitations_admins_update"
  on public.team_invitations for update
  using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

drop policy if exists "team_invitations_admins_delete" on public.team_invitations;
create policy "team_invitations_admins_delete"
  on public.team_invitations for delete
  using (private.is_org_admin(org_id));

grant select, insert, update, delete on public.sender_domains to authenticated;
grant select, insert, update, delete on public.team_invitations to authenticated;
