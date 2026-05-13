# Error Handling and Operations

## Purpose

This document tracks recurring operational issues, current error handling patterns, and checks to run after changes.

## Standard Verification

Run these before pushing meaningful code changes:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

After `next build`, the local dev server may need to be restarted because `.next` can hold stale compiled state.

## Dev Server Refresh

When the UI appears unstyled, broken, or routes throw runtime errors like:

- CSS file returns 404.
- `__webpack_modules__[moduleId] is not a function`.
- UI suddenly loses styling after a successful build.

Refresh the dev server:

1. Stop Node processes running this project.
2. Delete `.next` after verifying the path is inside the project root.
3. Restart:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

## Common App-Level Errors

### Email not confirmed

Cause: Supabase Auth requires email verification.

Handling:

- User is redirected to login with an error.
- Production email verification copy still needs final setup.

### Permission denied for RLS helper

Cause: RLS helper functions were callable in a way that the app role could not execute.

Handling:

- RLS helpers were moved to a private schema.
- Required grants were applied.

### CSV Server Action body limit

Cause: Next.js Server Actions have body-size limits.

Handling:

- CSV import uses route handlers:
  - `/contacts/import/submit`
  - `/contacts/import/duplicates`

### Contact sex constraint violation

Cause: Imported CSV values did not match allowed database values.

Handling:

- Import normalization maps valid values to `male`, `female`, `other`, or null.

### Bad request during import

Cause: Usually malformed mapping, invalid enum value, or stale server state.

Handling:

- Validate mapped fields.
- Normalize imported values.
- Restart dev server if route handler state is stale.

### Public security-definer RPC warning

Cause: Supabase flags public `security definer` functions.

Current state:

- RSVP token functions are intentionally public because RSVP links are public.
- They expose token-scoped lookup and token-scoped response only.
- Do not expose raw campaign/contact browsing through public endpoints.

### Email provider not configured

Cause: `RESEND_API_KEY` or `RESEND_FROM_EMAIL` is missing.

Handling:

- Test email and campaign send actions stop before calling Resend.
- UI shows a setup error.
- Local development currently uses `onboarding@resend.dev` for testing until a sender domain is verified.

### Campaign send failure

Cause: Resend rejects a recipient, network/API failure, or the app cannot update the accepted recipient's `send_log` row.

Handling:

- Campaign sending only targets pending `send_log` rows.
- Each accepted email is marked `delivered` with `sent_at`.
- If a later recipient fails, the campaign returns to `draft` so remaining pending rows can be retried.
- Resend requests use deterministic idempotency keys per recipient to reduce duplicate sends during retries.

### Invalid or disposable campaign recipients

Cause: One or more pending campaign recipients have `contacts.email_status` set to `invalid` or `disposable`.

Handling:

- The delivery console shows the blocked recipient count.
- The send checkbox and send button are disabled.
- The server action also blocks the send before calling Resend.
- Fix the email, remove the invitee, or verify/update the contact before sending.

### Email verification provider unavailable

Cause: Disify is rate-limited/unavailable, Reacher is not configured, or a provider returns an unexpected response.

Handling:

- The app tries Disify first.
- If Disify fails, the app tries Reacher when `REACHER_API_URL` is configured.
- If no external provider succeeds, the app performs syntax and domain MX checks.
- Clearly malformed addresses and domains without MX records become `invalid`.
- MX-valid addresses become `unknown` because mailbox-level deliverability was not confirmed.
- The stored `email_validations.provider` value shows which checker produced the final result: `disify`, `reacher`, or `syntax_mx`.

### Card asset upload failure

Cause: Invalid file type, file over 5MB, missing session, or Supabase Storage policy rejection.

Handling:

- Card designer accepts PNG, JPEG, WebP, and SVG files.
- Files are uploaded to the public `card-assets` bucket under the workspace ID path.
- Storage insert/update/delete policies require authenticated workspace membership.
- The card JSON stores the public URL and layer metadata, not base64 image content.

### Email asset upload failure

Symptoms:

- Image upload or attachment upload shows an upload error in the campaign editor.
- Uploaded image does not appear in preview.

Likely causes:

- User is not in a workspace.
- File exceeds the `email-assets` bucket 10 MB limit.
- File type is not in the allowed MIME list.
- Storage policy cannot match the org ID path prefix.

Expected behavior:

- Campaign editor uploads files under `{org_id}/campaign-assets/...`.
- Public URLs are stored in the email template design JSON.
- Images render in the email preview and sent email.
- Attachments render as a link in the email and are also passed to Resend as attachments during test and campaign sends.

## Supabase Security Advisor Current Known Warning

- Leaked password protection is disabled.

Action before production:

- Enable leaked password protection in Supabase Auth settings.

## Git and Release Notes

Current workflow:

1. Make scoped changes.
2. Run typecheck and build.
3. Refresh dev server if needed.
4. Commit.
5. Push to `main`.

## Documentation Maintenance

When a new feature is added, update:

- `docs/development/system-overview.md`
- the matching feature doc
- this operations doc if new errors or verification steps appear
