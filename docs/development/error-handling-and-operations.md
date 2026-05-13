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
