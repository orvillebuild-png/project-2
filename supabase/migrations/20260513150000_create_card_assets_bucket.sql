insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-assets',
  'card-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "card_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'card-assets');

create policy "card_assets_org_members_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );

create policy "card_assets_org_members_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'card-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  )
  with check (
    bucket_id = 'card-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );

create policy "card_assets_org_members_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'card-assets'
    and exists (
      select 1
      from public.org_users
      where org_users.org_id = ((storage.foldername(name))[1])::uuid
        and org_users.user_id = (select auth.uid())
    )
  );
