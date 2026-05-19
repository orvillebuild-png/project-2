alter table public.email_templates
  add column if not exists description text,
  add column if not exists is_library_template boolean not null default false;

create index if not exists email_templates_org_library_idx
  on public.email_templates(org_id, is_library_template, updated_at desc);
