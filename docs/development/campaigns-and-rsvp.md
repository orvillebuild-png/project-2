# Campaigns and RSVP

## Purpose

Campaigns create invitation drafts for event invitees, prepare recipient-specific RSVP links, send invitation emails through Resend, and track RSVP responses.

## Implemented Campaign Features

- Campaign list.
- New campaign draft.
- Campaign detail/edit page.
- Internal campaign name.
- Email subject.
- Email body.
- Basic email design controls.
- Campaign studio UI with separate campaign brief, message, design direction, preview, and delivery console areas.
- Campaign preview is opened intentionally from the message editor instead of running as a permanent side panel.
- The message preview action saves the current draft before opening the full email preview.
- Authenticated email preview route that renders the same HTML used by Resend.
- Full-size email preview screen.
- Email-safe template controls:
  - page, header, headline, accent, button text, body text, and muted color selection
  - font family selection from common email-safe fonts in the message toolbar
  - uploaded image URL, alt text, and drag-adjusted image width
- Shared campaign body editor for new drafts and later edits.
- Body editor toolbar for undo, redo, bold, italic, underline-style strong text, link insertion, lists, quote snippets, and emoji insertion.
- Message toolbar image upload and file attachment actions.
- Uploaded campaign image preview inside the message editor with direct drag resizing on the image.
- Emoji picker uses `emoji-picker-react` with client-only dynamic loading.
- Sender identity fields for from name and from email.
- File attachment upload and attachment link rendering.
- Merge-field preview.
- Recipient log generation.
- Campaign recipient RSVP status table.
- RSVP summary counts.
- Guarded Resend test email action.
- Guarded campaign send action.
- Campaign send guard blocks pending recipients marked `invalid` or `disposable`.
- Recipient table shows contact email verification status.
- Per-recipient delivery status updates after Resend accepts an email.

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
6. User reviews the live recipient preview in the campaign studio.
7. User generates RSVP links.
8. The app creates `send_log` records with unique `rsvp_token` values.
9. User reviews recipient email statuses.
10. User confirms the campaign send.
11. The app sends only pending recipient rows through Resend.
12. Each accepted email marks its `send_log` row as `delivered` with `sent_at`.
13. Campaign detail shows each recipient, email status, delivery status, and RSVP status.

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
- View RSVP summary counts for yes, maybe, no, and pending.
- Adjust the visible email layout without editing raw HTML.
- Compose the email in a focused studio layout instead of a single raw admin form.
- Review the exact email HTML before sending through the side preview or full-size preview.
- Tune the email template styling without editing raw HTML.
- Upload a campaign image or attachment into the `email-assets` Supabase Storage bucket.
- Insert a link into selected words using markdown-style `[text](url)` syntax, which renders as an email-safe link.
- Send one rendered test email when Resend is configured.
- Block real sends when selected recipients are known invalid or disposable.
- Send the real campaign to pending recipients after confirming the action.
- Resume a partial send by sending remaining pending recipients.

## Error Handling

- Campaign creation requires event, campaign name, subject, and message.
- Email design data is stored as JSON and falls back to safe defaults if missing.
- Recipient log generation requires event invitees.
- Recipient log generation only inserts missing records, so repeat sync is safe.
- RSVP token lookup returns 404 if token is invalid.
- RSVP submission only accepts `yes`, `maybe`, or `no`.
- Public RSVP RPCs expose only token-scoped lookup and token-scoped response submission.
- Test email sending requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- If email env vars are missing, the UI shows a setup error and does not attempt to send.
- Campaign sending requires a confirmation checkbox.
- Campaign sending only targets `send_log` rows with `delivery_status = pending`.
- Campaign sending stops before Resend if pending recipients include `invalid` or `disposable` email statuses.
- Pending, unknown, and risky email statuses are visible in the delivery console so the user can verify before sending.
- Resend calls use deterministic idempotency keys per campaign recipient to reduce accidental duplicate sends during retries.
- If a send fails partway through, already accepted recipients remain `delivered`; the campaign returns to `draft` so remaining pending recipients can be sent later.
- If no pending recipients exist, the send action stops without calling Resend.

## UI Direction

- The campaign editor follows the app's modern warm/yellow design direction.
- The editor separates content authoring from operational sending controls.
- Merge fields are always visible as chips while writing the message.
- Preview opens from the message editor so the main campaign page stays focused on editing and delivery controls.
- Side preview and full-size preview use an iframe pointed at the same HTML renderer used by Resend sends.
- Template controls intentionally use email-client-safe inline styles.
- Image insertion uploads from the message toolbar and stores the public URL, alt text, and target width in template design JSON.
- Image resizing is performed by dragging the handle on the previewed image itself.
- Uploaded email images and attachments are stored in a public org-scoped `email-assets` bucket.
- Attachments are included as Resend attachments when sending and also shown as a link in the email body.
- `from_email` must be a sender/domain Resend is allowed to send from; otherwise Resend will reject the send.
- Delivery actions are grouped into one console:
  - RSVP link generation/sync
  - test email
  - guarded real send
- The UI structure is inspired by "design direction" workflows: each screen should have a clear posture, not just a collection of fields.

## Important Files

- `app/(dashboard)/campaigns/page.tsx`
- `app/(dashboard)/campaigns/new/page.tsx`
- `app/(dashboard)/campaigns/[id]/page.tsx`
- `app/(dashboard)/campaigns/[id]/email-preview/route.ts`
- `app/(dashboard)/campaigns/[id]/preview/page.tsx`
- `components/campaigns/CampaignBodyEditor.tsx`
- `components/campaigns/EmailTemplateControls.tsx`
- `app/rsvp/[token]/page.tsx`
- `lib/campaigns.ts`
- `lib/rsvp.ts`

## Current Limitations

- Test email sending is available only when Resend env vars are configured.
- Real campaign sending is available only when Resend env vars are configured.
- Email body is still plain text-style editing inside a structured layout.
- No reusable drag-and-drop visual template builder yet.
- RSVP link is rendered as a CTA in preview and real sends.
- No campaign analytics yet beyond delivery status and recipient RSVP status.
- No Resend webhook processing yet for bounce, complaint, open, or click events.
