alter table public.send_campaigns
  add column if not exists name text;

update public.send_campaigns
set name = coalesce(email_templates.name, events.title || ' campaign')
from public.email_templates, public.events
where send_campaigns.template_id = email_templates.id
  and send_campaigns.event_id = events.id
  and send_campaigns.name is null;
