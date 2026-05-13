alter table public.contacts
  drop constraint if exists contacts_email_status_check;

alter table public.contacts
  add constraint contacts_email_status_check
  check (email_status in ('valid', 'invalid', 'disposable', 'risky', 'unknown', 'pending'));

alter table public.email_validations
  drop constraint if exists email_validations_status_check;

alter table public.email_validations
  add constraint email_validations_status_check
  check (status in ('valid', 'invalid', 'disposable', 'risky', 'unknown'));
