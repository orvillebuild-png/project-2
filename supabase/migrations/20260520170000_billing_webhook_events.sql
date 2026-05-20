create table if not exists public.billing_webhook_events (
  id text primary key,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

alter table public.billing_webhook_events enable row level security;

create index if not exists billing_webhook_events_event_name_idx
  on public.billing_webhook_events(event_name);
