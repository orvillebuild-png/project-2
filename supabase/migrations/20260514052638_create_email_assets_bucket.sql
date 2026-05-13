insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'email-assets',
  'email-assets',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "email_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'email-assets');

create policy "email_assets_org_members_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'email-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );

create policy "email_assets_org_members_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'email-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'email-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );

create policy "email_assets_org_members_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'email-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );
