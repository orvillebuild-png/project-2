# Contacts and CSV Import

## Purpose

Contacts are the central CRM records used for segmentation, event invitees, campaigns, and RSVP tracking.

## Implemented Contact Features

- Manual contact creation and editing.
- Contact detail page.
- Contact soft delete.
- Tags.
- Contact types.
- Bulk tagging.
- Bulk delete.
- Single-contact email verification.
- Bulk email verification from selected table rows.
- Contact filtering by:
  - search
  - type
  - tag
  - source
  - sex
  - age bracket
  - organization
  - email verification status
- Row count control: 20, 30, 40, 50.
- Contact history for imported/updated records.
- Suppression management for bounced, complained, unsubscribed, and manually suppressed contacts.
- Suppressed count on the main contact CRM metrics.

## Contact Fields

Implemented contact attributes include:

- salutation
- first name
- last name
- email
- phone
- alternate email
- alternate phone
- sex
- age
- organization/account name
- contact type
- address fields
- source
- email status
- tags

## CSV Import Flow

1. User opens import page.
2. User uploads a CSV file.
3. User maps CSV columns to supported contact fields.
4. Source is automatically assigned from the CSV filename.
5. Import validates and normalizes values.
6. Duplicate emails are detected.
7. User can update selected duplicate fields.
8. New records are inserted.
9. Import summary is shown.

## Use Cases

- Import a donor list from CSV.
- Add contacts manually after a phone call or event.
- Tag volunteers for future campaign filtering.
- Verify selected emails before sending a campaign.
- Filter all contacts from a specific import file.
- Filter contacts by email status to find risky, pending, or invalid addresses.
- Review suppressed contacts before sending campaigns.
- Manually suppress an existing contact when they should not receive campaign email.
- Remove a suppression after a contact explicitly asks to receive campaign email again.
- Bulk tag a selected group.
- Soft-delete incorrect contacts without destroying related history.

## Email Verification

Email status values are:

- `pending`
- `valid`
- `risky`
- `unknown`
- `disposable`
- `invalid`

The app uses Disify first because it has a useful free tier/no-key path for development and early production. Disify checks format, DNS/MX records, disposable domains, and confidence signals. If Disify is unavailable or rate-limited, the app falls back to Reacher when configured, then to a local syntax and domain MX check.

The local fallback can confirm obviously invalid addresses, but it cannot prove mailbox-level deliverability, so MX-valid addresses are marked `unknown`.

Verification writes a row to `email_validations`, updates `contacts.email_status`, updates `last_validated_at`, and records a `usage_events` entry for future billing/audit usage.

## Error Handling

- CSV imports use route handlers instead of Server Actions to avoid Server Action body-size limits.
- CSV files are restricted to CSV for now.
- Sex values are normalized to match database constraints: `male`, `female`, `other`, or null.
- Duplicate handling prevents accidental overwrites.
- Editing a contact email resets email status to `pending`.
- Source is locked/automatic:
  - Manual contact: `Manual Entry`
  - Imported contact: CSV filename
- Contact tables use horizontal scrolling to avoid clipped columns on small screens.
- Email verification uses Disify by default. Provider outages/rate limits fall back to the next configured checker.
- Local verification errors default to `unknown` unless the address is clearly malformed or the domain has no MX records.

## UI Direction

- Contacts should feel like a modern CRM work surface, not a basic admin table.
- Current contact list presentation uses:
  - compact metric cards for total contacts, verified emails, organizations, and suppressions
  - auto-submitting filter dropdowns with advanced filters tucked behind a compact toggle
  - mobile contact cards instead of forcing a wide table into small screens
  - desktop table with stronger borders, status chips, sticky bulk actions, and horizontal overflow protection
  - row-count control outside advanced filters
- Atomic CRM is the preferred reference for future CRM ergonomics because it is MIT-licensed and close to our React/Supabase stack.

## Important Files

- `app/(dashboard)/contacts/page.tsx`
- `app/(dashboard)/contacts/new/page.tsx`
- `app/(dashboard)/contacts/[id]/page.tsx`
- `app/(dashboard)/contacts/suppressions/page.tsx`
- `app/(dashboard)/contacts/import/page.tsx`
- `app/(dashboard)/contacts/import/submit/route.ts`
- `app/(dashboard)/contacts/import/duplicates/route.ts`
- `components/contacts/ContactTable.tsx`
- `components/contacts/ContactFilters.tsx`
- `components/contacts/CsvImportForm.tsx`
- `lib/contacts.ts`
- `lib/contact-import.ts`
- `lib/email-verification.ts`

## Current Limitations

- No advanced merge/household logic yet.
- No organization/account record model yet; organization is currently a contact attribute.
- No external CRM integrations yet.
- Address autocomplete/geocoding is not connected yet.
