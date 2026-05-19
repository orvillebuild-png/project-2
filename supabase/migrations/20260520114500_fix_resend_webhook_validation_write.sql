create or replace function public.process_resend_email_event(
  event_id text,
  event_type text,
  email_id text,
  recipient_email text,
  event_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_send_log_id uuid;
  target_org_id uuid;
  target_contact_id uuid;
  target_email text;
begin
  if event_id is null or event_id = '' then
    event_id := coalesce(email_id, 'unknown') || ':' || event_type || ':' || coalesce(recipient_email, '');
  end if;

  insert into public.resend_webhook_events (
    id,
    type,
    resend_email_id,
    payload
  )
  values (
    event_id,
    event_type,
    email_id,
    coalesce(event_payload, '{}'::jsonb)
  )
  on conflict (id) do nothing;

  if not found then
    return;
  end if;

  select
    send_log.id,
    send_campaigns.org_id,
    send_log.contact_id,
    contacts.email
  into target_send_log_id, target_org_id, target_contact_id, target_email
  from public.send_log
  join public.send_campaigns on send_campaigns.id = send_log.campaign_id
  join public.contacts on contacts.id = send_log.contact_id
  where (
    email_id is not null
    and send_log.resend_email_id = email_id
  )
  or (
    email_id is null
    and recipient_email is not null
    and lower(contacts.email) = lower(recipient_email)
  )
  order by send_log.sent_at desc nulls last
  limit 1;

  if target_send_log_id is null then
    return;
  end if;

  if event_type = 'email.delivered' then
    update public.send_log
    set delivery_status = case
          when delivery_status = 'pending' then 'delivered'
          else delivery_status
        end,
        last_provider_event_at = now()
    where id = target_send_log_id;
  elsif event_type = 'email.opened' then
    update public.send_log
    set opened_at = coalesce(opened_at, now()),
        last_provider_event_at = now()
    where id = target_send_log_id;
  elsif event_type = 'email.clicked' then
    update public.send_log
    set opened_at = coalesce(opened_at, now()),
        clicked_at = coalesce(clicked_at, now()),
        last_provider_event_at = now()
    where id = target_send_log_id;
  elsif event_type = 'email.bounced' or event_type = 'email.failed' then
    update public.send_log
    set delivery_status = 'bounced',
        last_provider_event_at = now()
    where id = target_send_log_id;

    update public.contacts
    set email_status = 'invalid',
        last_validated_at = now()
    where id = target_contact_id;

    insert into public.email_validations (
      contact_id,
      status,
      sub_status,
      is_disposable,
      mx_found,
      provider,
      validated_at
    )
    values (
      target_contact_id,
      'invalid',
      coalesce(event_payload #>> '{data,bounce,subType}', event_type),
      false,
      null,
      'resend_webhook',
      now()
    );

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
      'bounce',
      target_send_log_id
    )
    on conflict (org_id, contact_id) do update
      set reason = 'bounce',
          email = excluded.email,
          source_send_log_id = coalesce(public.contact_suppressions.source_send_log_id, excluded.source_send_log_id);
  elsif event_type = 'email.complained' or event_type = 'email.suppressed' then
    update public.send_log
    set delivery_status = case
          when event_type = 'email.complained' then 'complained'
          else 'suppressed'
        end,
        last_provider_event_at = now()
    where id = target_send_log_id;

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
      case when event_type = 'email.complained' then 'complaint' else 'bounce' end,
      target_send_log_id
    )
    on conflict (org_id, contact_id) do update
      set reason = excluded.reason,
          email = excluded.email,
          source_send_log_id = coalesce(public.contact_suppressions.source_send_log_id, excluded.source_send_log_id);
  end if;
end;
$$;
