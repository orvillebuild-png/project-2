drop policy if exists "team_invitations_visible_to_members" on public.team_invitations;
create policy "team_invitations_visible_to_members"
  on public.team_invitations for select
  using (
    private.is_org_member(org_id)
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );

drop policy if exists "team_invitations_admins_update" on public.team_invitations;
drop policy if exists "team_invitations_invitee_accept" on public.team_invitations;
create policy "team_invitations_admins_or_invitee_update"
  on public.team_invitations for update
  using (
    private.is_org_admin(org_id)
    or (
      status = 'pending'
      and expires_at > now()
      and lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    )
  )
  with check (
    private.is_org_admin(org_id)
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );
