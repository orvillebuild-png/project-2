alter table public.send_log
  drop constraint if exists send_log_delivery_status_check;

alter table public.send_log
  add constraint send_log_delivery_status_check
  check (delivery_status in ('pending', 'delivered', 'bounced', 'complained', 'suppressed'));

create table if not exists public.contact_suppressions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  email text not null,
  reason text not null default 'unsubscribe' check (reason in ('unsubscribe', 'bounce', 'complaint', 'manual')),
  source_send_log_id uuid references public.send_log(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_id, contact_id)
);

create index if not exists contact_suppressions_org_id_idx on public.contact_suppressions(org_id);
create index if not exists contact_suppressions_contact_id_idx on public.contact_suppressions(contact_id);
create index if not exists contact_suppressions_org_email_idx on public.contact_suppressions(org_id, lower(email));

alter table public.contact_suppressions enable row level security;

drop policy if exists "contact_suppressions_org_members_select" on public.contact_suppressions;
create policy "contact_suppressions_org_members_select"
  on public.contact_suppressions for select
  using (private.is_org_member(org_id));

drop policy if exists "contact_suppressions_org_members_insert" on public.contact_suppressions;
create policy "contact_suppressions_org_members_insert"
  on public.contact_suppressions for insert
  with check (private.is_org_member(org_id));

drop policy if exists "contact_suppressions_org_members_update" on public.contact_suppressions;
create policy "contact_suppressions_org_members_update"
  on public.contact_suppressions for update
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

drop policy if exists "contact_suppressions_org_admins_delete" on public.contact_suppressions;
create policy "contact_suppressions_org_admins_delete"
  on public.contact_suppressions for delete
  using (private.is_org_admin(org_id));

grant select, insert, update, delete on public.contact_suppressions to authenticated;

create or replace function public.get_unsubscribe_by_token(token text)
returns table (
  send_log_id uuid,
  org_name text,
  contact_email text,
  contact_name text,
  already_unsubscribed boolean
)
language sql
security definer
set search_path = public
as $$
  select
    send_log.id as send_log_id,
    orgs.name as org_name,
    contacts.email as contact_email,
    trim(coalesce(contacts.first_name, '') || ' ' || coalesce(contacts.last_name, '')) as contact_name,
    exists (
      select 1
      from public.contact_suppressions
      where contact_suppressions.org_id = send_campaigns.org_id
        and contact_suppressions.contact_id = contacts.id
    ) as already_unsubscribed
  from public.send_log
  join public.send_campaigns on send_campaigns.id = send_log.campaign_id
  join public.orgs on orgs.id = send_campaigns.org_id
  join public.contacts on contacts.id = send_log.contact_id
  where send_log.rsvp_token = token
  limit 1;
$$;

create or replace function public.unsubscribe_by_token(token text)
returns table (
  org_name text,
  contact_email text,
  already_unsubscribed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_send_log_id uuid;
  target_org_id uuid;
  target_contact_id uuid;
  target_email text;
  target_org_name text;
  existed boolean;
begin
  select
    send_log.id,
    send_campaigns.org_id,
    send_log.contact_id,
    contacts.email,
    orgs.name
  into target_send_log_id, target_org_id, target_contact_id, target_email, target_org_name
  from public.send_log
  join public.send_campaigns on send_campaigns.id = send_log.campaign_id
  join public.contacts on contacts.id = send_log.contact_id
  join public.orgs on orgs.id = send_campaigns.org_id
  where send_log.rsvp_token = token
  limit 1;

  if target_send_log_id is null then
    raise exception 'Invalid unsubscribe link';
  end if;

  select exists (
    select 1
    from public.contact_suppressions
    where org_id = target_org_id
      and contact_id = target_contact_id
  ) into existed;

  insert into public.contact_suppressions (
    org_id,
    contact_id,
    email,
    reason,
    source_send_log_id
  )
  values (
    target_org_id,
    target_contact_id,
    target_email,
    'unsubscribe',
    target_send_log_id
  )
  on conflict (org_id, contact_id) do update
    set reason = 'unsubscribe',
        email = excluded.email,
        source_send_log_id = coalesce(public.contact_suppressions.source_send_log_id, excluded.source_send_log_id);

  return query select target_org_name, target_email, existed;
end;
$$;

revoke all on function public.get_unsubscribe_by_token(text) from public;
revoke all on function public.unsubscribe_by_token(text) from public;
grant execute on function public.get_unsubscribe_by_token(text) to anon, authenticated;
grant execute on function public.unsubscribe_by_token(text) to anon, authenticated;
