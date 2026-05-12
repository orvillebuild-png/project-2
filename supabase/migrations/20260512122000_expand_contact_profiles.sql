create table public.contact_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

alter table public.contacts
  add column salutation text,
  add column organization_name text,
  add column contact_type_id uuid references public.contact_types(id) on delete set null,
  add column alternate_email text,
  add column alternate_phone text,
  add column address_line1 text,
  add column address_line2 text,
  add column city text,
  add column state_province text,
  add column postal_code text,
  add column country text;

create index contact_types_org_id_idx on public.contact_types(org_id);
create index contacts_contact_type_id_idx on public.contacts(contact_type_id);
create index contacts_org_contact_type_id_idx on public.contacts(org_id, contact_type_id);
create index contacts_org_organization_name_idx on public.contacts(org_id, organization_name);

alter table public.contact_types enable row level security;

create policy "contact_types_org_members_all"
  on public.contact_types for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

insert into public.contact_types (org_id, name, color)
select id, type_name, type_color
from public.orgs
cross join (
  values
    ('Donor', '#39705f'),
    ('Volunteer', '#6f9f77'),
    ('Board member', '#c88a32'),
    ('Sponsor', '#df705f'),
    ('Partner', '#5b7c99'),
    ('Staff', '#667085'),
    ('Attendee', '#7a6fbe'),
    ('Prospect', '#9a6b4f'),
    ('Press/media', '#4d8f9f'),
    ('Other', '#8a8f98')
) as defaults(type_name, type_color)
on conflict (org_id, name) do nothing;
