create schema if not exists private;

revoke usage on schema private from anon, authenticated;

create or replace function private.is_org_member(target_org_id uuid)
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
      and org_users.user_id = (select auth.uid())
  )
$$;

create or replace function private.is_org_admin(target_org_id uuid)
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
      and org_users.user_id = (select auth.uid())
      and org_users.role = 'admin'
  )
$$;

revoke execute on function private.is_org_member(uuid) from public, anon, authenticated;
revoke execute on function private.is_org_admin(uuid) from public, anon, authenticated;

drop policy if exists "users_can_read_self" on public.users;
drop policy if exists "users_can_update_self" on public.users;
drop policy if exists "orgs_visible_to_members" on public.orgs;
drop policy if exists "authenticated_users_can_create_orgs" on public.orgs;
drop policy if exists "org_admins_can_update_orgs" on public.orgs;
drop policy if exists "org_users_visible_to_members" on public.org_users;
drop policy if exists "org_users_insertable_by_authenticated_users" on public.org_users;
drop policy if exists "org_admins_can_update_org_users" on public.org_users;
drop policy if exists "org_admins_can_delete_org_users" on public.org_users;
drop policy if exists "contacts_org_members_select" on public.contacts;
drop policy if exists "contacts_org_members_insert" on public.contacts;
drop policy if exists "contacts_org_members_update" on public.contacts;
drop policy if exists "contacts_org_members_delete" on public.contacts;
drop policy if exists "tags_org_members_all" on public.tags;
drop policy if exists "contact_tags_org_members_all" on public.contact_tags;
drop policy if exists "locations_org_members_all" on public.locations;
drop policy if exists "events_org_members_all" on public.events;
drop policy if exists "attendance_org_members_all" on public.attendance;
drop policy if exists "email_templates_org_members_all" on public.email_templates;
drop policy if exists "invitation_cards_org_members_all" on public.invitation_cards;
drop policy if exists "send_campaigns_org_members_all" on public.send_campaigns;
drop policy if exists "send_log_org_members_all" on public.send_log;
drop policy if exists "rsvp_responses_org_members_all" on public.rsvp_responses;
drop policy if exists "email_validations_org_members_all" on public.email_validations;
drop policy if exists "usage_events_org_admins_select" on public.usage_events;
drop policy if exists "usage_events_org_members_insert" on public.usage_events;
drop policy if exists "usage_events_org_admins_update" on public.usage_events;
drop policy if exists "audit_log_org_members_select" on public.audit_log;
drop policy if exists "audit_log_org_members_insert" on public.audit_log;

create policy "users_can_read_self"
  on public.users for select
  using (id = (select auth.uid()));

create policy "users_can_update_self"
  on public.users for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "orgs_visible_to_members"
  on public.orgs for select
  using (private.is_org_member(id));

create policy "authenticated_users_can_create_orgs"
  on public.orgs for insert
  with check ((select auth.uid()) is not null);

create policy "org_admins_can_update_orgs"
  on public.orgs for update
  using (private.is_org_admin(id))
  with check (private.is_org_admin(id));

create policy "org_users_visible_to_members"
  on public.org_users for select
  using (private.is_org_member(org_id));

create policy "org_users_insertable_by_authenticated_users"
  on public.org_users for insert
  with check ((select auth.uid()) is not null);

create policy "org_admins_can_update_org_users"
  on public.org_users for update
  using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

create policy "org_admins_can_delete_org_users"
  on public.org_users for delete
  using (private.is_org_admin(org_id));

create policy "contacts_org_members_select"
  on public.contacts for select
  using (private.is_org_member(org_id));

create policy "contacts_org_members_insert"
  on public.contacts for insert
  with check (private.is_org_member(org_id));

create policy "contacts_org_members_update"
  on public.contacts for update
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "contacts_org_members_delete"
  on public.contacts for delete
  using (private.is_org_member(org_id));

create policy "tags_org_members_all"
  on public.tags for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "contact_tags_org_members_all"
  on public.contact_tags for all
  using (
    exists (
      select 1 from public.contacts
      where contacts.id = contact_tags.contact_id
        and private.is_org_member(contacts.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.contacts
      where contacts.id = contact_tags.contact_id
        and private.is_org_member(contacts.org_id)
    )
  );

create policy "locations_org_members_all"
  on public.locations for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "events_org_members_all"
  on public.events for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "attendance_org_members_all"
  on public.attendance for all
  using (
    exists (
      select 1 from public.events
      where events.id = attendance.event_id
        and private.is_org_member(events.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = attendance.event_id
        and private.is_org_member(events.org_id)
    )
  );

create policy "email_templates_org_members_all"
  on public.email_templates for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "invitation_cards_org_members_all"
  on public.invitation_cards for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "send_campaigns_org_members_all"
  on public.send_campaigns for all
  using (private.is_org_member(org_id))
  with check (private.is_org_member(org_id));

create policy "send_log_org_members_all"
  on public.send_log for all
  using (
    exists (
      select 1 from public.send_campaigns
      where send_campaigns.id = send_log.campaign_id
        and private.is_org_member(send_campaigns.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.send_campaigns
      where send_campaigns.id = send_log.campaign_id
        and private.is_org_member(send_campaigns.org_id)
    )
  );

create policy "rsvp_responses_org_members_all"
  on public.rsvp_responses for all
  using (
    exists (
      select 1 from public.events
      where events.id = rsvp_responses.event_id
        and private.is_org_member(events.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.events
      where events.id = rsvp_responses.event_id
        and private.is_org_member(events.org_id)
    )
  );

create policy "email_validations_org_members_all"
  on public.email_validations for all
  using (
    exists (
      select 1 from public.contacts
      where contacts.id = email_validations.contact_id
        and private.is_org_member(contacts.org_id)
    )
  )
  with check (
    exists (
      select 1 from public.contacts
      where contacts.id = email_validations.contact_id
        and private.is_org_member(contacts.org_id)
    )
  );

create policy "usage_events_org_admins_select"
  on public.usage_events for select
  using (private.is_org_admin(org_id));

create policy "usage_events_org_members_insert"
  on public.usage_events for insert
  with check (private.is_org_member(org_id));

create policy "usage_events_org_admins_update"
  on public.usage_events for update
  using (private.is_org_admin(org_id))
  with check (private.is_org_admin(org_id));

create policy "audit_log_org_members_select"
  on public.audit_log for select
  using (private.is_org_member(org_id));

create policy "audit_log_org_members_insert"
  on public.audit_log for insert
  with check (private.is_org_member(org_id));

drop function if exists public.is_org_member(uuid);
drop function if exists public.is_org_admin(uuid);
