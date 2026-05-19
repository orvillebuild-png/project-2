revoke execute on function public.process_resend_email_event(text, text, text, text, jsonb) from anon;
revoke execute on function public.process_resend_email_event(text, text, text, text, jsonb) from authenticated;
grant execute on function public.process_resend_email_event(text, text, text, text, jsonb) to service_role;
