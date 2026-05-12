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
  id uuid primary key references auth.users(id) on delete cascade,
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

create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'org_id', '')::uuid
$$;

create or replace function public.current_org_role()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'role', '')
$$;

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_users
    where org_users.org_id = target_org_id
      and org_users.user_id = auth.uid()
  )
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.org_users
    where org_users.org_id = target_org_id
      and org_users.user_id = auth.uid()
      and org_users.role = 'admin'
  )
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', new.email)
  )
  on conflict (id) do update
    set email = excluded.email,
        name = coalesce(excluded.name, public.users.name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create policy "users_can_read_self"
  on public.users for select
  using (id = auth.uid());

create policy "users_can_update_self"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "orgs_visible_to_members"
  on public.orgs for select
  using (public.is_org_member(id));

create policy "authenticated_users_can_create_orgs"
  on public.orgs for insert
  with check (auth.uid() is not null);

create policy "org_admins_can_update_orgs"
  on public.orgs for update
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

create policy "org_users_visible_to_members"
  on public.org_users for select
  using (public.is_org_member(org_id));

create policy "org_users_insertable_by_authenticated_users"
  on public.org_users for insert
  with check (auth.uid() is not null);

create policy "org_admins_can_update_org_users"
  on public.org_users for update
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "org_admins_can_delete_org_users"
  on public.org_users for delete
  using (public.is_org_admin(org_id));

create policy "contacts_org_members_select"
  on public.contacts for select
  using (public.is_org_member(org_id));

create policy "contacts_org_members_insert"
  on public.contacts for insert
  with check (public.is_org_member(org_id));

create policy "contacts_org_members_update"
  on public.contacts for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "contacts_org_members_delete"
  on public.contacts for delete
  using (public.is_org_member(org_id));

create policy "tags_org_members_all"
  on public.tags for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "contact_tags_org_members_all"
  on public.contact_tags for all
  using (
    exists (
      select 1 from public.contacts
      where contacts.id = contact_tags.contact_id
        and public.is_org_member(contacts.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.contacts
      where contacts.id = contact_tags.contact_id
        and public.is_org_member(contacts.org_id)
    )
  );

create policy "locations_org_members_all"
  on public.locations for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "events_org_members_all"
  on public.events for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "attendance_org_members_all"
  on public.attendance for all
  using (
    exists (
      select 1 from public.events
      where events.id = attendance.event_id
        and public.is_org_member(events.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = attendance.event_id
        and public.is_org_member(events.org_id)
    )
  );

create policy "email_templates_org_members_all"
  on public.email_templates for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "invitation_cards_org_members_all"
  on public.invitation_cards for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "send_campaigns_org_members_all"
  on public.send_campaigns for all
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "send_log_org_members_all"
  on public.send_log for all
  using (
    exists (
      select 1 from public.send_campaigns
      where send_campaigns.id = send_log.campaign_id
        and public.is_org_member(send_campaigns.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.send_campaigns
      where send_campaigns.id = send_log.campaign_id
        and public.is_org_member(send_campaigns.org_id)
    )
  );

create policy "rsvp_responses_org_members_all"
  on public.rsvp_responses for all
  using (
    exists (
      select 1 from public.events
      where events.id = rsvp_responses.event_id
        and public.is_org_member(events.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = rsvp_responses.event_id
        and public.is_org_member(events.org_id)
    )
  );

create policy "email_validations_org_members_all"
  on public.email_validations for all
  using (
    exists (
      select 1 from public.contacts
      where contacts.id = email_validations.contact_id
        and public.is_org_member(contacts.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.contacts
      where contacts.id = email_validations.contact_id
        and public.is_org_member(contacts.org_id)
    )
  );

create policy "usage_events_org_admins_select"
  on public.usage_events for select
  using (public.is_org_admin(org_id));

create policy "usage_events_org_members_insert"
  on public.usage_events for insert
  with check (public.is_org_member(org_id));

create policy "usage_events_org_admins_update"
  on public.usage_events for update
  using (public.is_org_admin(org_id))
  with check (public.is_org_admin(org_id));

create policy "audit_log_org_members_select"
  on public.audit_log for select
  using (public.is_org_member(org_id));

create policy "audit_log_org_members_insert"
  on public.audit_log for insert
  with check (public.is_org_member(org_id));
