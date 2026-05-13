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
- Contact filtering by:
  - search
  - type
  - tag
  - source
  - sex
  - age bracket
  - organization
- Row count control: 20, 30, 40, 50.
- Contact history for imported/updated records.

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
- Filter all contacts from a specific import file.
- Bulk tag a selected group.
- Soft-delete incorrect contacts without destroying related history.

## Error Handling

- CSV imports use route handlers instead of Server Actions to avoid Server Action body-size limits.
- CSV files are restricted to CSV for now.
- Sex values are normalized to match database constraints: `male`, `female`, `other`, or null.
- Duplicate handling prevents accidental overwrites.
- Source is locked/automatic:
  - Manual contact: `Manual Entry`
  - Imported contact: CSV filename
- Contact tables use horizontal scrolling to avoid clipped columns on small screens.

## Important Files

- `app/(dashboard)/contacts/page.tsx`
- `app/(dashboard)/contacts/new/page.tsx`
- `app/(dashboard)/contacts/[id]/page.tsx`
- `app/(dashboard)/contacts/import/page.tsx`
- `app/(dashboard)/contacts/import/submit/route.ts`
- `app/(dashboard)/contacts/import/duplicates/route.ts`
- `components/contacts/ContactTable.tsx`
- `components/contacts/ContactFilters.tsx`
- `components/contacts/CsvImportForm.tsx`
- `lib/contacts.ts`
- `lib/contact-import.ts`

## Current Limitations

- No advanced merge/household logic yet.
- No organization/account record model yet; organization is currently a contact attribute.
- No external CRM integrations yet.
- Address autocomplete/geocoding is not connected yet.
