create table if not exists public.email_template_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.email_templates(id) on delete cascade,
  org_id uuid not null references public.orgs(id) on delete cascade,
  version_number integer not null,
  name text not null,
  description text,
  subject text not null,
  html_body text not null,
  design_data jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(template_id, version_number)
);

create index if not exists email_template_versions_template_idx
  on public.email_template_versions(template_id, version_number desc);

create index if not exists email_template_versions_org_idx
  on public.email_template_versions(org_id, created_at desc);

alter table public.email_template_versions enable row level security;

grant select, insert, update, delete on public.email_template_versions to authenticated;

create policy "email_template_versions_org_members_all"
  on public.email_template_versions for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));
