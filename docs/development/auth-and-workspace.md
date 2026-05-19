# Auth and Workspace

## Purpose

Authentication identifies the user. Workspace creation establishes the organization that owns all CRM, event, campaign, and billing records.

## Implemented Flow

1. User signs up through Supabase Auth.
2. User confirms email.
3. User logs in.
4. If no organization exists, the app sends the user to workspace setup.
5. Workspace setup creates:
   - `orgs`
   - `users`
   - `org_users`
6. Dashboard routes require a logged-in user and active organization membership.
7. Admins can send team invitation links from Settings.
8. Invitees open `/team/invite/[token]`, sign in or create an invited account, and accept with the invited email address.
9. Accepted invites create an `org_users` membership and mark the invitation accepted.

## Use Cases

- New nonprofit user creates an account and workspace.
- Returning user logs in and lands in dashboard.
- User without workspace is redirected to onboarding.
- Workspace owns all contacts, events, campaigns, and later billing.
- Admin invites a teammate as member or admin.
- New teammate creates an account without creating a separate workspace, then accepts the invitation.
- Existing teammate logs in from the invite link and joins the organization.

## Important Files

- `app/(auth)/actions.ts`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/team/invite/[token]/page.tsx`
- `app/onboarding/create-org/page.tsx`
- `app/(dashboard)/layout.tsx`
- `lib/auth.ts`
- `lib/orgs.ts`
- `lib/settings.ts`

## Error Handling

- Missing login session redirects to login.
- Missing organization redirects to onboarding.
- Email not confirmed is surfaced through the login URL error state.
- Login preserves a `next` URL so invitation links can return to the acceptance screen.
- Invite acceptance requires the authenticated email to match the invitation email.
- Expired, missing, reused, or wrong-email invitations show explicit invite-page errors.
- RLS helper permissions were hardened by moving callable helpers into the private schema and granting only required execution.

## Current Limitations

- Email confirmation template and branding still need final production copy.
- Supabase leaked password protection is disabled and should be enabled before production.
- Removing teammates and protecting the last admin still need final admin controls.
