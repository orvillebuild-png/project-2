alter table public.attendance drop constraint if exists attendance_status_check;

alter table public.attendance add constraint attendance_status_check
  check (status in ('invited', 'waitlisted', 'confirmed', 'declined', 'attended', 'no_show'));

create or replace function public.get_rsvp_by_token(token text)
returns table (
  send_log_id uuid,
  campaign_id uuid,
  event_id uuid,
  contact_id uuid,
  contact_name text,
  contact_email text,
  event_title text,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  venue_address text,
  response text,
  responded_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    send_log.id as send_log_id,
    send_log.campaign_id,
    send_campaigns.event_id,
    send_log.contact_id,
    trim(concat_ws(' ', contacts.first_name, contacts.last_name)) as contact_name,
    contacts.email as contact_email,
    events.title as event_title,
    events.starts_at,
    events.ends_at,
    locations.name as venue_name,
    locations.address as venue_address,
    rsvp_responses.response,
    rsvp_responses.responded_at
  from public.send_log
  join public.send_campaigns on send_campaigns.id = send_log.campaign_id
  join public.events on events.id = send_campaigns.event_id
  join public.contacts on contacts.id = send_log.contact_id
  left join public.locations on locations.id = events.location_id
  left join public.rsvp_responses on rsvp_responses.send_log_id = send_log.id
  where send_log.rsvp_token = token
  limit 1;
$$;

create or replace function public.submit_rsvp_response(token text, answer text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_send_log_id uuid;
  target_event_id uuid;
  target_contact_id uuid;
  attendance_status text;
begin
  if answer not in ('yes', 'no', 'maybe') then
    raise exception 'Invalid RSVP response';
  end if;

  select
    send_log.id,
    send_campaigns.event_id,
    send_log.contact_id
  into target_send_log_id, target_event_id, target_contact_id
  from public.send_log
  join public.send_campaigns on send_campaigns.id = send_log.campaign_id
  where send_log.rsvp_token = token
  limit 1;

  if target_send_log_id is null then
    raise exception 'RSVP token not found';
  end if;

  insert into public.rsvp_responses (
    send_log_id,
    event_id,
    contact_id,
    response
  ) values (
    target_send_log_id,
    target_event_id,
    target_contact_id,
    answer
  )
  on conflict (send_log_id) do update
    set response = excluded.response,
        responded_at = now();

  attendance_status := case answer
    when 'yes' then 'confirmed'
    when 'maybe' then 'waitlisted'
    else 'declined'
  end;

  update public.attendance
  set status = attendance_status
  where event_id = target_event_id
    and contact_id = target_contact_id;
end;
$$;

revoke all on function public.get_rsvp_by_token(text) from public;
revoke all on function public.submit_rsvp_response(text, text) from public;

grant execute on function public.get_rsvp_by_token(text) to anon, authenticated;
grant execute on function public.submit_rsvp_response(text, text) to anon, authenticated;
