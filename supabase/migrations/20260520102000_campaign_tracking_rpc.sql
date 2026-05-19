create or replace function public.record_campaign_open(token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.send_log
  set opened_at = coalesce(opened_at, now())
  where rsvp_token = token;
$$;

create or replace function public.record_campaign_click(token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.send_log
  set opened_at = coalesce(opened_at, now()),
      clicked_at = coalesce(clicked_at, now())
  where rsvp_token = token;
$$;

revoke all on function public.record_campaign_open(text) from public;
revoke all on function public.record_campaign_click(text) from public;
grant execute on function public.record_campaign_open(text) to anon, authenticated;
grant execute on function public.record_campaign_click(text) to anon, authenticated;
