alter table public.email_templates
  add column if not exists created_at timestamptz not null default now();
