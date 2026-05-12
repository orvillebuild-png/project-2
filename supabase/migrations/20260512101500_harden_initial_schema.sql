alter function public.current_org_id() set search_path = '';
alter function public.current_org_role() set search_path = '';

revoke execute on function public.handle_new_auth_user() from anon, authenticated;

create index audit_log_actor_id_idx on public.audit_log(actor_id);
create index contact_tags_applied_by_idx on public.contact_tags(applied_by);
create index contact_tags_tag_id_idx on public.contact_tags(tag_id);
create index email_templates_org_id_idx on public.email_templates(org_id);
create index events_location_id_idx on public.events(location_id);
create index invitation_cards_org_id_idx on public.invitation_cards(org_id);
create index org_users_user_id_idx on public.org_users(user_id);
create index rsvp_responses_contact_id_idx on public.rsvp_responses(contact_id);
create index rsvp_responses_event_id_idx on public.rsvp_responses(event_id);
create index rsvp_responses_location_preference_idx on public.rsvp_responses(location_preference);
create index send_campaigns_card_id_idx on public.send_campaigns(card_id);
create index send_campaigns_event_id_idx on public.send_campaigns(event_id);
create index send_campaigns_org_id_idx on public.send_campaigns(org_id);
create index send_campaigns_template_id_idx on public.send_campaigns(template_id);
