create extension if not exists pgcrypto;

create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  sender_name text,
  sender_email text,
  reply_to_email text,
  billing_provider text not null default 'lemonsqueezy',
  billing_customer_id text,
  billing_subscription_id text,
  billing_email_item_id text,
  billing_validation_item_id text,
  plan_status text not null default 'trialing',
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key,
  email text not null,
  name text,
  created_at timestamptz not null default now()
);

create table public.org_users (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  first_name text,
  last_name text,
  email text not null,
  phone text,
  sex text check (sex in ('male', 'female', 'other') or sex is null),
  age int,
  source text,
  email_status text not null default 'pending' check (email_status in ('valid', 'invalid', 'disposable', 'unknown', 'pending')),
  last_validated_at timestamptz,
  custom_fields jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  color text,
  unique (org_id, name)
);

create table public.contact_tags (
  contact_id uuid not null references public.contacts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  applied_by uuid references public.users(id) on delete set null,
  applied_at timestamptz not null default now(),
  primary key (contact_id, tag_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  address text,
  lat float8,
  lng float8
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  parent_event_id uuid references public.events(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  title text not null,
  type text not null check (type in ('single', 'recurring', 'multi_location')),
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  recurrence_rule text,
  capacity int,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null check (status in ('waitlisted', 'confirmed', 'attended', 'no_show')),
  checked_in_at timestamptz,
  unique (event_id, contact_id)
);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  subject text not null,
  html_body text not null,
  merge_tags jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.invitation_cards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  canvas_data jsonb not null default '{}'::jsonb,
  preview_url text,
  updated_at timestamptz not null default now()
);

create table public.send_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  template_id uuid references public.email_templates(id) on delete set null,
  card_id uuid references public.invitation_cards(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent')),
  filter_snapshot jsonb not null default '{}'::jsonb,
  recipient_count int not null default 0,
  scheduled_at timestamptz,
  sent_at timestamptz
);

create table public.send_log (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.send_campaigns(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  rsvp_token text not null unique,
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'delivered', 'bounced', 'complained')),
  opened_at timestamptz,
  clicked_at timestamptz,
  sent_at timestamptz
);

create table public.rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  send_log_id uuid not null unique references public.send_log(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  response text not null check (response in ('yes', 'no', 'maybe')),
  location_preference uuid references public.locations(id) on delete set null,
  responded_at timestamptz not null default now()
);

create table public.email_validations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  status text not null check (status in ('valid', 'invalid', 'disposable', 'unknown')),
  sub_status text,
  is_disposable boolean,
  mx_found boolean,
  provider text,
  validated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  event_type text not null check (event_type in ('email_sent', 'validation_run')),
  quantity int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  billing_reported boolean not null default false,
  billing_reported_at timestamptz,
  billing_idempotency_key text not null unique,
  occurred_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  occurred_at timestamptz not null default now()
);

create index contacts_org_id_idx on public.contacts(org_id);
create index contacts_email_idx on public.contacts(email);
create index contacts_org_email_status_idx on public.contacts(org_id, email_status);
create index contacts_org_deleted_at_idx on public.contacts(org_id, deleted_at);
create index tags_org_id_idx on public.tags(org_id);
create index locations_org_id_idx on public.locations(org_id);
create index events_org_id_idx on public.events(org_id);
create index events_org_status_idx on public.events(org_id, status);
create index events_parent_event_id_idx on public.events(parent_event_id);
create index events_starts_at_idx on public.events(starts_at);
create index attendance_event_id_idx on public.attendance(event_id);
create index attendance_contact_id_idx on public.attendance(contact_id);
create index send_log_campaign_id_idx on public.send_log(campaign_id);
create index send_log_contact_id_idx on public.send_log(contact_id);
create index send_log_rsvp_token_idx on public.send_log(rsvp_token);
create index email_validations_contact_id_idx on public.email_validations(contact_id);
create index usage_events_org_id_idx on public.usage_events(org_id);
create index audit_log_org_id_idx on public.audit_log(org_id);

alter table public.orgs enable row level security;
alter table public.users enable row level security;
alter table public.org_users enable row level security;
alter table public.contacts enable row level security;
alter table public.tags enable row level security;
alter table public.contact_tags enable row level security;
alter table public.locations enable row level security;
alter table public.events enable row level security;
alter table public.attendance enable row level security;
alter table public.email_templates enable row level security;
alter table public.invitation_cards enable row level security;
alter table public.send_campaigns enable row level security;
alter table public.send_log enable row level security;
alter table public.rsvp_responses enable row level security;
alter table public.email_validations enable row level security;
alter table public.usage_events enable row level security;
alter table public.audit_log enable row level security;
