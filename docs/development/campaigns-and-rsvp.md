# Campaigns and RSVP

## Purpose

Campaigns create invitation drafts for event invitees and prepare recipient-specific RSVP links before real email sending is connected.

## Implemented Campaign Features

- Campaign list.
- New campaign draft.
- Campaign detail/edit page.
- Internal campaign name.
- Email subject.
- Email body.
- Basic email design controls.
- Merge-field preview.
- Recipient log generation.
- Campaign recipient RSVP status table.

## Supported Merge Fields

- `{{first_name}}`
- `{{event_title}}`
- `{{event_date}}`
- `{{venue}}`
- `{{rsvp_link}}`

## Current Campaign Flow

1. User selects an event.
2. Campaign uses the event's selected invitees as its recipient source.
3. User enters campaign name, subject, and message.
4. User configures basic email design fields:
   - headline
   - intro copy
   - RSVP button label
   - footer
   - event details block visibility
5. Campaign is saved as draft.
6. User generates RSVP links.
7. The app creates `send_log` records with unique `rsvp_token` values.
8. Campaign detail shows each recipient and RSVP status.

## RSVP Flow

1. User opens `/rsvp/[token]`.
2. App resolves the token through a scoped public RPC.
3. RSVP page shows:
   - event title
   - contact name/email
   - schedule
   - venue
   - Yes, Maybe, No buttons
4. Response is saved to `rsvp_responses`.
5. Attendance status is updated.
6. Campaign recipient table reflects the response.

## Use Cases

- Draft an invitation for a donation drive.
- Preview event merge fields before sending.
- Generate a recipient-specific RSVP link.
- Test RSVP response loop without email sending.
- Track pending/yes/maybe/no response status from the campaign page.
- Adjust the visible email layout without editing raw HTML.

## Error Handling

- Campaign creation requires event, campaign name, subject, and message.
- Email design data is stored as JSON and falls back to safe defaults if missing.
- Recipient log generation requires event invitees.
- Recipient log generation only inserts missing records, so repeat sync is safe.
- RSVP token lookup returns 404 if token is invalid.
- RSVP submission only accepts `yes`, `maybe`, or `no`.
- Public RSVP RPCs expose only token-scoped lookup and token-scoped response submission.

## Important Files

- `app/(dashboard)/campaigns/page.tsx`
- `app/(dashboard)/campaigns/new/page.tsx`
- `app/(dashboard)/campaigns/[id]/page.tsx`
- `app/rsvp/[token]/page.tsx`
- `lib/campaigns.ts`
- `lib/rsvp.ts`

## Current Limitations

- No real email sending yet.
- Delivery status remains `pending` until an email provider is connected.
- Email body is still plain text-style editing inside a structured layout.
- No reusable drag-and-drop visual template builder yet.
- RSVP link is rendered as a CTA in preview, but real email sending is not connected yet.
- No campaign analytics yet beyond recipient RSVP status.
