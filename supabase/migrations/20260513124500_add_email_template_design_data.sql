alter table public.email_templates
  add column if not exists design_data jsonb not null default '{}'::jsonb;
