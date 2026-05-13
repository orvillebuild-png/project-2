alter table public.attendance drop constraint if exists attendance_status_check;

alter table public.attendance add constraint attendance_status_check
  check (status in ('invited', 'waitlisted', 'confirmed', 'attended', 'no_show'));

grant select, insert, update, delete on public.attendance to authenticated;
