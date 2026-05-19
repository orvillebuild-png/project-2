alter table public.team_invitations
  add column if not exists token text,
  add column if not exists expires_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists accepted_at timestamptz;

update public.team_invitations
set token = encode(gen_random_bytes(24), 'hex')
where token is null;

alter table public.team_invitations
  alter column token set not null;

create unique index if not exists team_invitations_token_key on public.team_invitations(token);
create index if not exists team_invitations_email_status_idx on public.team_invitations(lower(email), status);

drop policy if exists "team_invitations_visible_to_members" on public.team_invitations;
create policy "team_invitations_visible_to_members"
  on public.team_invitations for select
  using (
    private.is_org_member(org_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "team_invitations_invitee_accept" on public.team_invitations;
create policy "team_invitations_invitee_accept"
  on public.team_invitations for update
  using (
    status = 'pending'
    and expires_at > now()
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  with check (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
