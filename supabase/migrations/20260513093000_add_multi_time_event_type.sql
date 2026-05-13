alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in ('single', 'recurring', 'multi_location', 'multi_time'));
